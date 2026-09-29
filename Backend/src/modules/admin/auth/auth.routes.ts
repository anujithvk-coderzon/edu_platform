import { Router } from "express";
import { authMiddleware, adminOnly } from "../../../middlewares/auth";
import {
  bootstrapAdmin,
  changePassword,
  checkTutorEmail,
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  registerTutor,
  registerTutorPublic,
  registerUser,
  resetPassword,
  sendTutorVerification,
  updateProfile,
  verifyForgotPasswordOtp,
  verifyTutorOtp,
} from "./auth.controller";

/** Mounted at /api/admin/auth — paths unchanged. */
const router = Router();

router.post("/bootstrap-admin", bootstrapAdmin);

// Staff creation is an admin action, never public signup.
router.post("/register", authMiddleware, adminOnly, registerUser);
router.post("/create-tutor", authMiddleware, adminOnly, registerTutor);

router.post("/login", login);
router.post("/logout", authMiddleware, logout);

// Public tutor self-signup
router.post("/tutor/check-email", checkTutorEmail);
router.post("/tutor/verify-email", sendTutorVerification);
router.post("/tutor/verify-otp", verifyTutorOtp);
router.post("/tutor/register", registerTutorPublic);

router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOtp);
router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, getCurrentUser);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

export default router;
