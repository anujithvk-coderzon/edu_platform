"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsHybridAuth = exports.IsTutor = exports.IsAdmin = exports.IsAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const IsAuthenticated = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header) {
            res.status(401).json({ message: "Not Authorized" });
            return;
        }
        const token = header.split(" ")[1];
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                res.status(401).json({ message: "Not Authorized" });
                return;
            }
            req.user = decoded;
            next();
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Unexpected Error Occurred", error: error.message });
    }
};
exports.IsAuthenticated = IsAuthenticated;
const IsAdmin = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header) {
            res.status(401).json({ message: "Not Authorized" });
            return;
        }
        const token = header.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await DB_Config_1.default.admin.findUnique({
            where: { id: decoded.id },
        });
        if (!user || user.role !== "admin") {
            res.status(403).json({ message: "Admin access required" });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Unexpected Error Occurred", error: error.message });
    }
};
exports.IsAdmin = IsAdmin;
const IsTutor = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header) {
            res.status(401).json({ message: "Not Authorized" });
            return;
        }
        const token = header.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await DB_Config_1.default.admin.findUnique({
            where: { id: decoded.id },
        });
        if (!user || user.role !== "tutor") {
            res.status(403).json({ message: "Tutor access required" });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Unexpected Error Occurred", error: error.message });
    }
};
exports.IsTutor = IsTutor;
const IsHybridAuth = async (req, res, next) => {
    try {
        let token;
        let decoded;
        const header = req.headers.authorization;
        if (header && header.startsWith("Bearer ")) {
            token = header.split(" ")[1];
            try {
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                let user = null;
                if (decoded.role === "admin") {
                    user = await DB_Config_1.default.admin.findUnique({
                        where: { id: decoded.id },
                    });
                }
                else if (decoded.role === "tutor") {
                    user = await DB_Config_1.default.admin.findUnique({
                        where: { id: decoded.id },
                    });
                }
                else if (decoded.role === "student") {
                    user = await DB_Config_1.default.student.findUnique({
                        where: { id: decoded.id },
                    });
                }
                if (!user) {
                    res.status(401).json({ message: "User not found" });
                    return;
                }
                req.user = user;
                req.authMethod = "jwt";
                return next();
            }
            catch (err) {
                res.status(401).json({ message: "Invalid token" });
                return;
            }
        }
        token = req.cookies.auth_token;
        if (!token) {
            res.status(401).json({ message: "Not Authorized - No token provided" });
            return;
        }
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        let user = null;
        if (decoded.role === "admin") {
            user = await DB_Config_1.default.admin.findUnique({
                where: { id: decoded.id },
            });
        }
        else if (decoded.role === "tutor") {
            user = await DB_Config_1.default.admin.findUnique({
                where: { id: decoded.id },
            });
        }
        else if (decoded.role === "student") {
            user = await DB_Config_1.default.student.findUnique({
                where: { id: decoded.id },
            });
        }
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }
        req.user = user;
        req.authMethod = "cookie";
        next();
    }
    catch (error) {
        res
            .status(401)
            .json({ message: "Invalid or expired token", error: error.message });
    }
};
exports.IsHybridAuth = IsHybridAuth;
