"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const auth_controller_1 = require("./auth.controller");
/**
 * Mounted at /api/student/auth — the paths below match the previous routes
 * exactly, so no client change is required.
 *
 * Validation lives in auth.validation.ts (zod), not here; routes only map a
 * path to middleware and a controller.
 */
const router = (0, express_1.Router)();
router.post("/check-email", auth_controller_1.checkEmail);
router.post("/verify-email", auth_controller_1.verifyEmail);
router.post("/verify-otp-email", auth_controller_1.verifyOtpEmail);
router.post("/register", auth_controller_1.register);
router.post("/verify-otp", auth_controller_1.verifyOtp);
router.post("/resend-otp", auth_controller_1.resendOtp);
router.post("/oauth-register", auth_controller_1.oauthRegister);
router.post("/oauth-login", auth_controller_1.oauthLogin);
router.post("/login", auth_controller_1.login);
router.post("/logout", auth_controller_1.logout);
router.post("/forgot-password", auth_controller_1.forgotPassword);
router.post("/verify-forgot-password-otp", auth_controller_1.verifyForgotPasswordOtp);
router.post("/reset-password", auth_controller_1.resetPassword);
router.get("/me", auth_1.authMiddleware, auth_controller_1.getCurrentUser);
router.put("/profile", auth_1.authMiddleware, auth_controller_1.updateProfile);
router.put("/change-password", auth_1.authMiddleware, auth_controller_1.changePassword);
exports.default = router;
