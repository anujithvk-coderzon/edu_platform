"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePassword = exports.UpdateProfile = exports.GetCurrentUser = exports.AdminResetPassword = exports.AdminVerifyForgotPasswordOtp = exports.AdminForgotPassword = exports.LogoutUser = exports.LoginUser = exports.RegisterTutor = exports.RegisterUser = exports.BootstrapAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const EmailVerification_1 = require("../utils/EmailVerification");
const GenerateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
};
const BootstrapAdmin = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: "Validation failed", details: errors.array() },
            });
            return;
        }
        const adminExists = await DB_Config_1.default.admin.findFirst();
        if (adminExists) {
            res.status(400).json({
                success: false,
                error: { message: "Admin already exists. Use /register endpoint." },
            });
            return;
        }
        const { email, password, firstName, lastName } = req.body;
        const existingAdmin = await DB_Config_1.default.admin.findUnique({
            where: { email },
        });
        if (existingAdmin) {
            res.status(400).json({
                success: false,
                error: { message: "Admin already exists with this email" },
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await DB_Config_1.default.admin.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: "admin",
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });
        const token = GenerateToken(user.id);
        const cookieName = "admin_token";
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({
            success: true,
            data: { user, token },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.BootstrapAdmin = BootstrapAdmin;
const RegisterUser = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: "Validation failed", details: errors.array() },
            });
            return;
        }
        const { email, password, firstName, lastName, role } = req.body;
        if (role === "admin") {
            const existingAdmin = await DB_Config_1.default.admin.findUnique({
                where: { email },
            });
            if (existingAdmin) {
                res.status(400).json({
                    success: false,
                    error: { message: "Admin already exists with this email" },
                });
                return;
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            const user = await DB_Config_1.default.admin.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: "admin",
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    createdAt: true,
                },
            });
            const token = GenerateToken(user.id);
            const cookieName = "admin_token";
            res.cookie(cookieName, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(201).json({
                success: true,
                data: { user, token },
            });
        }
        else if (role === "tutor") {
            const existingTutor = await DB_Config_1.default.admin.findUnique({
                where: { email },
            });
            if (existingTutor) {
                res.status(400).json({
                    success: false,
                    error: { message: "Tutor already exists with this email" },
                });
                return;
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            const user = await DB_Config_1.default.admin.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: "tutor",
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    createdAt: true,
                },
            });
            const token = GenerateToken(user.id);
            const cookieName = "tutor_token";
            res.cookie(cookieName, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(201).json({
                success: true,
                data: { user, token },
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: { message: "Invalid role specified" },
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.RegisterUser = RegisterUser;
const RegisterTutor = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Only admins can register tutors" },
            });
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: "Validation failed", details: errors.array() },
            });
            return;
        }
        const { email, password, firstName, lastName } = req.body;
        const existingTutor = await DB_Config_1.default.admin.findUnique({
            where: { email },
        });
        if (existingTutor) {
            res.status(400).json({
                success: false,
                error: { message: "Tutor already exists with this email" },
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const tutor = await DB_Config_1.default.admin.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: "tutor",
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });
        res.status(201).json({
            success: true,
            data: { tutor },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.RegisterTutor = RegisterTutor;
const LoginUser = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: "Validation failed", details: errors.array() },
            });
            return;
        }
        const { email, password, role } = req.body;
        let user = null;
        let cookieName;
        if (role === "admin") {
            user = await DB_Config_1.default.admin.findUnique({
                where: { email },
            });
            cookieName = "admin_token";
        }
        else if (role === "tutor") {
            user = await DB_Config_1.default.admin.findUnique({
                where: { email },
            });
            cookieName = "tutor_token";
        }
        else {
            res.status(400).json({
                success: false,
                error: { message: "Invalid role specified" },
            });
            return;
        }
        if (!user) {
            res.status(401).json({
                success: false,
                error: { message: "Invalid credentials" },
            });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: { message: "Invalid credentials" },
            });
            return;
        }
        const token = GenerateToken(user.id);
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({
            success: true,
            data: { user: userWithoutPassword, token },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.LoginUser = LoginUser;
const LogoutUser = (req, res) => {
    try {
        res.clearCookie("admin_token");
        res.clearCookie("tutor_token");
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.LogoutUser = LogoutUser;
const AdminForgotPassword = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: "Validation failed", details: errors.array() },
            });
            return;
        }
        const { email } = req.body;
        const admin = await DB_Config_1.default.admin.findUnique({
            where: { email },
        });
        if (!admin) {
            res.status(404).json({
                success: false,
                error: { message: "Admin not found with this email" },
            });
            return;
        }
        const otp = (0, EmailVerification_1.generateOTP)();
        (0, EmailVerification_1.StoreForgetOtp)(email, otp);
        await (0, EmailVerification_1.ForgetPasswordMail)(email, otp);
        res.status(200).json({
            success: true,
            message: "OTP sent to your email",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.AdminForgotPassword = AdminForgotPassword;
const AdminVerifyForgotPasswordOtp = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: "Validation failed", details: errors.array() },
            });
            return;
        }
        const { email, otp } = req.body;
        const isValid = (0, EmailVerification_1.VerifyForgetOtp)(email, otp);
        if (!isValid) {
            res.status(400).json({
                success: false,
                error: { message: "Invalid or expired OTP" },
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.AdminVerifyForgotPasswordOtp = AdminVerifyForgotPasswordOtp;
const AdminResetPassword = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: "Validation failed", details: errors.array() },
            });
            return;
        }
        const { email, newPassword } = req.body;
        const admin = await DB_Config_1.default.admin.findUnique({
            where: { email },
        });
        if (!admin) {
            res.status(404).json({
                success: false,
                error: { message: "Admin not found" },
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await DB_Config_1.default.admin.update({
            where: { email },
            data: { password: hashedPassword },
        });
        (0, EmailVerification_1.ClearForgetOtp)(email);
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.AdminResetPassword = AdminResetPassword;
const GetCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: { user: req.user },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetCurrentUser = GetCurrentUser;
const UpdateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: "Validation failed", details: errors.array() },
            });
            return;
        }
        const updates = req.body;
        delete updates.password;
        delete updates.email;
        delete updates.role;
        let updatedUser;
        if (req.user.role === "admin") {
            updatedUser = await DB_Config_1.default.admin.update({
                where: { id: req.user.id },
                data: updates,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    createdAt: true,
                },
            });
        }
        else if (req.user.role === "tutor") {
            updatedUser = await DB_Config_1.default.admin.update({
                where: { id: req.user.id },
                data: updates,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    createdAt: true,
                },
            });
        }
        res.status(200).json({
            success: true,
            data: { user: updatedUser },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UpdateProfile = UpdateProfile;
const ChangePassword = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: "Validation failed", details: errors.array() },
            });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        // Fetch user with password to verify
        let user;
        if (req.user.role === "admin" || req.user.role === "tutor") {
            user = await DB_Config_1.default.admin.findUnique({
                where: { id: req.user.id },
            });
        }
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: "User not found" },
            });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: { message: "Current password is incorrect" },
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        if (req.user.role === "admin") {
            await DB_Config_1.default.admin.update({
                where: { id: req.user.id },
                data: { password: hashedPassword },
            });
        }
        else if (req.user.role === "tutor") {
            await DB_Config_1.default.admin.update({
                where: { id: req.user.id },
                data: { password: hashedPassword },
            });
        }
        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.ChangePassword = ChangePassword;
