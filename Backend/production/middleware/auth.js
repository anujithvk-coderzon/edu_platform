"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.roleCheck = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const authMiddleware = async (req, res, next) => {
    try {
        // Check for role-specific cookies first, then fallback to Authorization header
        const adminToken = req.cookies.admin_token;
        const studentToken = req.cookies.student_token;
        const headerToken = req.header('Authorization')?.replace('Bearer ', '');
        const token = adminToken || studentToken || headerToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                error: { message: 'Access denied. No token provided.' }
            });
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        catch (jwtError) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid token.' }
            });
        }
        let user = null;
        let userType;
        // Determine user type from token or cookie
        if (decoded.type) {
            userType = decoded.type;
        }
        else if (adminToken) {
            userType = 'admin';
        }
        else if (studentToken) {
            userType = 'student';
        }
        else {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid token type.' }
            });
        }
        // Fetch user from appropriate table
        if (userType === 'admin') {
            user = await DB_Config_1.default.admin.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    isVerified: true
                }
            });
        }
        else {
            user = await DB_Config_1.default.student.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    isActive: true,
                    isVerified: true,
                    activeSessionToken: true
                }
            });
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid token.' }
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: { message: 'Account is deactivated.' }
            });
        }
        // For students: Validate session token to prevent concurrent logins
        if (userType === 'student') {
            // Session token is required for students
            if (!decoded.sessionToken) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Invalid session. Please login again.' }
                });
            }
            // Check if session token matches the active one in database
            if (!user.activeSessionToken || user.activeSessionToken !== decoded.sessionToken) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Session expired. You have been logged in from another device.' }
                });
            }
        }
        // Validate that the token cookie matches the user type
        // Allow if the correct cookie exists for the determined user type
        if ((userType === 'admin' && !adminToken) || (userType === 'student' && !studentToken)) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid token for user type.' }
            });
        }
        req.user = {
            ...user,
            type: userType,
            role: userType === 'admin' ? user.role : undefined
        };
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
};
exports.authMiddleware = authMiddleware;
const roleCheck = (allowedTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Authentication required.' }
            });
        }
        if (!allowedTypes.includes(req.user.type)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Insufficient permissions.' }
            });
        }
        next();
    };
};
exports.roleCheck = roleCheck;
exports.adminOnly = (0, exports.roleCheck)(['admin']);
