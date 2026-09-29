import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth";
import {
  changePassword,
  checkEmail,
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  oauthLogin,
  oauthRegister,
  register,
  resendOtp,
  resetPassword,
  updateProfile,
  verifyEmail,
  verifyForgotPasswordOtp,
  verifyOtp,
  verifyOtpEmail,
} from "./auth.controller";

/**
 * Mounted at /api/student/auth — the paths below match the previous routes
 * exactly, so no client change is required.
 *
 * Validation lives in auth.validation.ts (zod), not here; routes only map a
 * path to middleware and a controller.
 */
const router = Router();

router.post("/check-email", checkEmail);
router.post("/verify-email", verifyEmail);
router.post("/verify-otp-email", verifyOtpEmail);

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.post("/oauth-register", oauthRegister);
router.post("/oauth-login", oauthLogin);

router.post("/login", login);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOtp);
router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, getCurrentUser);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

export default router;
