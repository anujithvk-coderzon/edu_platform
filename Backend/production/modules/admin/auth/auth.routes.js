"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const auth_controller_1 = require("./auth.controller");
/** Mounted at /api/admin/auth — paths unchanged. */
const router = (0, express_1.Router)();
router.post("/bootstrap-admin", auth_controller_1.bootstrapAdmin);
// Staff creation is an admin action, never public signup.
router.post("/register", auth_1.authMiddleware, auth_1.adminOnly, auth_controller_1.registerUser);
router.post("/create-tutor", auth_1.authMiddleware, auth_1.adminOnly, auth_controller_1.registerTutor);
router.post("/login", auth_controller_1.login);
router.post("/logout", auth_1.authMiddleware, auth_controller_1.logout);
// Public tutor self-signup
router.post("/tutor/check-email", auth_controller_1.checkTutorEmail);
router.post("/tutor/verify-email", auth_controller_1.sendTutorVerification);
router.post("/tutor/verify-otp", auth_controller_1.verifyTutorOtp);
router.post("/tutor/register", auth_controller_1.registerTutorPublic);
router.post("/forgot-password", auth_controller_1.forgotPassword);
router.post("/verify-forgot-password-otp", auth_controller_1.verifyForgotPasswordOtp);
router.post("/reset-password", auth_controller_1.resetPassword);
router.get("/me", auth_1.authMiddleware, auth_controller_1.getCurrentUser);
router.put("/profile", auth_1.authMiddleware, auth_controller_1.updateProfile);
router.put("/change-password", auth_1.authMiddleware, auth_controller_1.changePassword);
exports.default = router;
