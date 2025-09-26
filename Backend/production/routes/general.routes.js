"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
// Import prisma and middleware
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
// ===== UTILITY FUNCTIONS =====
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
// ===== ADMIN REGISTRATION ROUTE (for creating admin through Postman) =====
router.post('/auth/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, password, firstName, lastName, role = 'Tutor' } = req.body;
    // Ensure role is properly capitalized
    const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    // Check if admin already exists with this email
    const existingAdmin = await DB_Config_1.default.admin.findUnique({
        where: { email }
    });
    if (existingAdmin) {
        return res.status(400).json({
            success: false,
            error: { message: 'Admin already exists with this email' }
        });
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const user = await DB_Config_1.default.admin.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: capitalizedRole,
            isVerified: true, // Auto-verify admin accounts created through API
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true,
            createdAt: true
        }
    });
    res.status(201).json({
        success: true,
        message: `${capitalizedRole} created successfully`,
        data: {
            user
        }
    });
}));
// ===== BOOTSTRAP ADMIN ROUTE =====
router.post('/auth/bootstrap-admin', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check if any admin exists
    const adminExists = await DB_Config_1.default.admin.findFirst();
    if (adminExists) {
        return res.status(400).json({
            success: false,
            error: { message: 'Admin already exists. Use /auth/register endpoint.' }
        });
    }
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, password, firstName, lastName } = req.body;
    const existingAdmin = await DB_Config_1.default.admin.findUnique({
        where: { email }
    });
    if (existingAdmin) {
        return res.status(400).json({
            success: false,
            error: { message: 'Admin already exists with this email' }
        });
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const user = await DB_Config_1.default.admin.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            isVerified: true,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true
        }
    });
    const token = generateToken(user.id);
    res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(201).json({
        success: true,
        data: { user, token }
    });
}));
exports.default = router;
