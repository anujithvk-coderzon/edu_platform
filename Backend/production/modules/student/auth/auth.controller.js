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
exports.changePassword = exports.updateProfile = exports.getCurrentUser = exports.resetPassword = exports.verifyForgotPasswordOtp = exports.forgotPassword = exports.logout = exports.login = exports.oauthLogin = exports.oauthRegister = exports.resendOtp = exports.verifyOtp = exports.register = exports.verifyOtpEmail = exports.verifyEmail = exports.checkEmail = void 0;
const jwt_1 = require("../../../lib/jwt");
const authToken_1 = require("../../../lib/authToken");
const Errors_1 = require("../../../errors/Errors");
const authService = __importStar(require("./auth.service"));
const auth_validation_1 = require("./auth.validation");
/**
 * Controllers are HTTP-only: parse the request, call a service, shape the
 * response. They never touch Prisma and never try/catch — Express 5 forwards
 * thrown errors (and rejected promises) to errorHandler.
 *
 * The `{ success, data }` envelope is preserved exactly: both frontends branch
 * on `success`, so it is API contract rather than style.
 */
const clientIP = (req) => (req.ip || req.headers["x-forwarded-for"] || "unknown");
const parse = (schema, body) => {
    const result = schema.safeParse(body);
    if (!result.success)
        throw result.error;
    return result.data;
};
/** The route's authMiddleware has already validated the caller. */
const requireStudentId = (req) => {
    if (req.user?.id)
        return req.user.id;
    // Defensive: a route mounted without authMiddleware would land here.
    const token = (0, authToken_1.getStudentToken)(req);
    const decoded = token ? (0, jwt_1.verifyStudentToken)(token) : null;
    if (!decoded?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return decoded.id;
};
const checkEmail = async (req, res) => {
    const { email } = parse(auth_validation_1.checkEmailSchema, req.body);
    const data = await authService.checkEmailService(email);
    return res
        .status(200)
        .json({ success: true, message: "Email is available", data });
};
exports.checkEmail = checkEmail;
const verifyEmail = async (req, res) => {
    const { email } = parse(auth_validation_1.verifyEmailSchema, req.body);
    const data = await authService.sendEmailOtpService(email);
    return res.status(200).json({
        success: true,
        message: "Verification code sent to your email. Please check your inbox.",
        data,
    });
};
exports.verifyEmail = verifyEmail;
const verifyOtpEmail = async (req, res) => {
    const { email, otp } = parse(auth_validation_1.verifyOtpEmailSchema, req.body);
    const data = authService.verifyEmailOtpService(email, otp);
    return res.status(200).json({
        success: true,
        message: "Email verified successfully! You can now complete your registration.",
        data,
    });
};
exports.verifyOtpEmail = verifyOtpEmail;
const register = async (req, res) => {
    const input = parse(auth_validation_1.registerSchema, req.body);
    const data = await authService.registerService(input);
    return res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please verify to complete registration.",
        data,
    });
};
exports.register = register;
const verifyOtp = async (req, res) => {
    const { email, otp } = parse(auth_validation_1.verifyOtpSchema, req.body);
    const { user, token } = await authService.verifyRegistrationOtpService(email, otp, clientIP(req));
    res.cookie("student_token", token, (0, jwt_1.sessionCookieOptions)());
    return res.status(201).json({
        success: true,
        message: "Email verified successfully. Account created!",
        data: { user, token },
    });
};
exports.verifyOtp = verifyOtp;
const resendOtp = async (req, res) => {
    const { email } = parse(auth_validation_1.resendOtpSchema, req.body);
    const data = await authService.resendOtpService(email);
    return res
        .status(200)
        .json({ success: true, message: "New OTP sent to your email.", data });
};
exports.resendOtp = resendOtp;
const oauthRegister = async (req, res) => {
    const input = parse(auth_validation_1.oauthRegisterSchema, req.body);
    const { user, token } = await authService.oauthRegisterService(input, clientIP(req));
    res.cookie("student_token", token, (0, jwt_1.sessionCookieOptions)());
    return res.status(201).json({
        success: true,
        message: "Registration successful! Welcome aboard!",
        data: { user, token },
    });
};
exports.oauthRegister = oauthRegister;
const oauthLogin = async (req, res) => {
    const { idToken } = parse(auth_validation_1.oauthLoginSchema, req.body);
    const { user, token } = await authService.oauthLoginService(idToken, clientIP(req));
    res.cookie("student_token", token, (0, jwt_1.sessionCookieOptions)());
    return res
        .status(200)
        .json({ success: true, message: "Login successful!", data: { user, token } });
};
exports.oauthLogin = oauthLogin;
const login = async (req, res) => {
    const { email, password } = parse(auth_validation_1.loginSchema, req.body);
    const { user, token } = await authService.loginService(email, password, clientIP(req));
    res.cookie("student_token", token, (0, jwt_1.sessionCookieOptions)());
    return res.json({ success: true, data: { user, token } });
};
exports.login = login;
const logout = async (req, res) => {
    const token = (0, authToken_1.getStudentToken)(req);
    const decoded = token ? (0, jwt_1.verifyStudentToken)(token) : null;
    await authService.logoutService(decoded?.id);
    const { maxAge, ...clearOptions } = (0, jwt_1.sessionCookieOptions)();
    res.clearCookie("student_token", { ...clearOptions, path: "/" });
    return res.json({ success: true, message: "Logged out successfully" });
};
exports.logout = logout;
const forgotPassword = async (req, res) => {
    const { email } = parse(auth_validation_1.forgotPasswordSchema, req.body);
    const data = await authService.forgotPasswordService(email);
    return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset code.",
        data,
    });
};
exports.forgotPassword = forgotPassword;
const verifyForgotPasswordOtp = async (req, res) => {
    const { email, otp } = parse(auth_validation_1.verifyForgotOtpSchema, req.body);
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
    const data = await authService.resetPasswordService(email, otp, newPassword);
    return res.status(200).json({
        success: true,
        message: "Password reset successfully! You can now login with your new password.",
        data,
    });
};
exports.resetPassword = resetPassword;
const getCurrentUser = async (req, res) => {
    const token = (0, authToken_1.getStudentToken)(req);
    const decoded = token ? (0, jwt_1.verifyStudentToken)(token) : null;
    const data = await authService.getCurrentUserService(requireStudentId(req), decoded?.sessionToken);
    return res.json({ success: true, data });
};
exports.getCurrentUser = getCurrentUser;
const updateProfile = async (req, res) => {
    const input = parse(auth_validation_1.updateProfileSchema, req.body);
    const data = await authService.updateProfileService(requireStudentId(req), input);
    return res.json({ success: true, data });
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = parse(auth_validation_1.changePasswordSchema, req.body);
    await authService.changePasswordService(requireStudentId(req), currentPassword, newPassword);
    return res.json({
        success: true,
        message: "Password changed successfully!",
    });
};
exports.changePassword = changePassword;
