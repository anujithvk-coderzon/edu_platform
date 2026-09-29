"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getCurrentUser = exports.resetPassword = exports.verifyForgotPasswordOtp = exports.forgotPassword = exports.logout = exports.login = exports.registerTutorPublic = exports.verifyTutorOtp = exports.sendTutorVerification = exports.checkTutorEmail = exports.registerTutor = exports.registerUser = exports.bootstrapAdmin = void 0;
const Errors_1 = require("../../../errors/Errors");
const jwt_1 = require("../../../lib/jwt");
const authService = __importStar(require("./auth.service"));
const auth_validation_1 = require("./auth.validation");
/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
const parse = (schema, body) => {
    const result = schema.safeParse(body);
    if (!result.success)
        throw result.error;
    return result.data;
};
const adminId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
const ADMIN_COOKIE = "admin_token";
const bootstrapAdmin = async (req, res) => {
    const input = parse(auth_validation_1.bootstrapAdminSchema, req.body);
    const { user, token } = await authService.bootstrapAdminService(input);
    res.cookie(ADMIN_COOKIE, token, { ...(0, jwt_1.sessionCookieOptions)(), path: "/" });
    return res.status(201).json({ success: true, data: { user, token } });
};
exports.bootstrapAdmin = bootstrapAdmin;
const registerUser = async (req, res) => {
    const input = parse(auth_validation_1.registerUserSchema, req.body);
    const { user, userRole } = await authService.registerUserService(input);
    return res.status(201).json({
        success: true,
        data: { user },
        message: `${userRole} created successfully and is active. A welcome email has been sent.`,
    });
};
exports.registerUser = registerUser;
const registerTutor = async (req, res) => {
    // adminOnly covers the route, but the original handler also checked the
    // role explicitly; keep that guarantee at the controller boundary.
    if (req.user?.type !== "admin" || req.user?.role !== "Admin") {
        throw new Errors_1.ForbiddenError("Only admins can register tutors");
    }
    const input = parse(auth_validation_1.registerTutorSchema, req.body);
    const data = await authService.registerTutorService(input);
    return res.status(201).json({
        success: true,
        data,
        message: "Tutor created successfully. Please activate the tutor account before they can login.",
    });
};
exports.registerTutor = registerTutor;
const checkTutorEmail = async (req, res) => {
    const { email } = parse(auth_validation_1.emailOnlySchema, req.body);
    const data = await authService.checkTutorEmailService(email);
    return res
        .status(200)
        .json({ success: true, message: "Email is available", data });
};
exports.checkTutorEmail = checkTutorEmail;
const sendTutorVerification = async (req, res) => {
    const { email } = parse(auth_validation_1.emailOnlySchema, req.body);
    const data = await authService.sendTutorOtpService(email);
    return res.status(200).json({
        success: true,
        message: "Verification code sent to your email. Please check your inbox.",
        data,
    });
};
exports.sendTutorVerification = sendTutorVerification;
const verifyTutorOtp = async (req, res) => {
    const { email, otp } = parse(auth_validation_1.verifyOtpSchema, req.body);
    const data = authService.verifyTutorOtpService(email, otp);
    return res.status(200).json({
        success: true,
        message: "Email verified successfully. You can now complete your registration.",
        data,
    });
};
exports.verifyTutorOtp = verifyTutorOtp;
const registerTutorPublic = async (req, res) => {
    const input = parse(auth_validation_1.registerTutorSchema, req.body);
    const data = await authService.registerTutorPublicService(input);
    return res.status(201).json({
        success: true,
        data,
        message: "Tutor registration request submitted successfully. You will be notified once your request is reviewed by an admin.",
    });
};
exports.registerTutorPublic = registerTutorPublic;
const login = async (req, res) => {
    const { email, password } = parse(auth_validation_1.loginSchema, req.body);
    const { user, token } = await authService.loginService(email, password);
    res.cookie(ADMIN_COOKIE, token, { ...(0, jwt_1.sessionCookieOptions)(), path: "/" });
    return res.json({ success: true, data: { user, token } });
};
exports.login = login;
const logout = async (_req, res) => {
    res.clearCookie(ADMIN_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
    });
    return res.json({ success: true, message: "Logged out successfully" });
};
exports.logout = logout;
const forgotPassword = async (req, res) => {
    const { email } = parse(auth_validation_1.emailOnlySchema, req.body);
    const data = await authService.forgotPasswordService(email);
    return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset code.",
        data,
    });
};
exports.forgotPassword = forgotPassword;
const verifyForgotPasswordOtp = async (req, res) => {
    const { email, otp } = parse(auth_validation_1.verifyOtpSchema, req.body);
    const data = authService.verifyForgotOtpService(email, otp);
    return res.status(200).json({
        success: true,
        message: "OTP verified successfully! You can now reset your password.",
        data,
    });
};
exports.verifyForgotPasswordOtp = verifyForgotPasswordOtp;
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = parse(auth_validation_1.resetPasswordSchema, req.body);
    const admin = await authService.resetPasswordService(email, otp, newPassword);
    return res.status(200).json({
        success: true,
        message: "Password reset successfully! You can now login with your new password.",
        data: { email: admin.email, firstName: admin.firstName },
    });
};
exports.resetPassword = resetPassword;
const getCurrentUser = async (req, res) => {
    const data = await authService.getCurrentUserService(adminId(req));
    return res.json({ success: true, data });
};
exports.getCurrentUser = getCurrentUser;
const updateProfile = async (req, res) => {
    const input = parse(auth_validation_1.updateProfileSchema, req.body);
    const data = await authService.updateProfileService(adminId(req), input);
    return res.json({ success: true, data });
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = parse(auth_validation_1.changePasswordSchema, req.body);
    await authService.changePasswordService(adminId(req), currentPassword, newPassword);
    return res.json({ success: true, message: "Password changed successfully" });
};
exports.changePassword = changePassword;
