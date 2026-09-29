import type { Request, Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { ForbiddenError, UnauthorizedError } from "../../../errors/Errors";
import { sessionCookieOptions } from "../../../lib/jwt";
import * as authService from "./auth.service";
import {
  bootstrapAdminSchema,
  changePasswordSchema,
  emailOnlySchema,
  loginSchema,
  registerTutorSchema,
  registerUserSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from "./auth.validation";

/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
const parse = <T>(schema: { safeParse: (v: unknown) => any }, body: unknown): T => {
  const result = schema.safeParse(body);
  if (!result.success) throw result.error;
  return result.data as T;
};

const adminId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

const ADMIN_COOKIE = "admin_token";

export const bootstrapAdmin = async (req: Request, res: Response) => {
  const input = parse<any>(bootstrapAdminSchema, req.body);
  const { user, token } = await authService.bootstrapAdminService(input);

  res.cookie(ADMIN_COOKIE, token, { ...sessionCookieOptions(), path: "/" });
  return res.status(201).json({ success: true, data: { user, token } });
};

export const registerUser = async (req: Request, res: Response) => {
  const input = parse<any>(registerUserSchema, req.body);
  const { user, userRole } = await authService.registerUserService(input);

  return res.status(201).json({
    success: true,
    data: { user },
    message: `${userRole} created successfully and is active. A welcome email has been sent.`,
  });
};

export const registerTutor = async (req: AuthRequest, res: Response) => {
  // adminOnly covers the route, but the original handler also checked the
  // role explicitly; keep that guarantee at the controller boundary.
  if (req.user?.type !== "admin" || req.user?.role !== "Admin") {
    throw new ForbiddenError("Only admins can register tutors");
  }

  const input = parse<any>(registerTutorSchema, req.body);
  const data = await authService.registerTutorService(input);

  return res.status(201).json({
    success: true,
    data,
    message:
      "Tutor created successfully. Please activate the tutor account before they can login.",
  });
};

export const checkTutorEmail = async (req: Request, res: Response) => {
  const { email } = parse<{ email: string }>(emailOnlySchema, req.body);
  const data = await authService.checkTutorEmailService(email);
  return res
    .status(200)
    .json({ success: true, message: "Email is available", data });
};

export const sendTutorVerification = async (req: Request, res: Response) => {
  const { email } = parse<{ email: string }>(emailOnlySchema, req.body);
  const data = await authService.sendTutorOtpService(email);
  return res.status(200).json({
    success: true,
    message: "Verification code sent to your email. Please check your inbox.",
    data,
  });
};

export const verifyTutorOtp = async (req: Request, res: Response) => {
  const { email, otp } = parse<{ email: string; otp: string }>(
    verifyOtpSchema,
    req.body,
  );
  const data = authService.verifyTutorOtpService(email, otp);
  return res.status(200).json({
    success: true,
    message: "Email verified successfully. You can now complete your registration.",
    data,
  });
};

export const registerTutorPublic = async (req: Request, res: Response) => {
  const input = parse<any>(registerTutorSchema, req.body);
  const data = await authService.registerTutorPublicService(input);
  return res.status(201).json({
    success: true,
    data,
    message:
      "Tutor registration request submitted successfully. You will be notified once your request is reviewed by an admin.",
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = parse<{ email: string; password: string }>(
    loginSchema,
    req.body,
  );
  const { user, token } = await authService.loginService(email, password);

  res.cookie(ADMIN_COOKIE, token, { ...sessionCookieOptions(), path: "/" });
  return res.json({ success: true, data: { user, token } });
};

export const logout = async (_req: AuthRequest, res: Response) => {
  res.clearCookie(ADMIN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  return res.json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = parse<{ email: string }>(emailOnlySchema, req.body);
  const data = await authService.forgotPasswordService(email);
  return res.status(200).json({
    success: true,
    message:
      "If an account exists with this email, you will receive a password reset code.",
    data,
  });
};

export const verifyForgotPasswordOtp = async (req: Request, res: Response) => {
  const { email, otp } = parse<{ email: string; otp: string }>(
    verifyOtpSchema,
    req.body,
  );
  const data = authService.verifyForgotOtpService(email, otp);
  return res.status(200).json({
    success: true,
    message: "OTP verified successfully! You can now reset your password.",
    data,
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = parse<{
    email: string;
    otp: string;
    newPassword: string;
  }>(resetPasswordSchema, req.body);

  const admin = await authService.resetPasswordService(email, otp, newPassword);
  return res.status(200).json({
    success: true,
    message:
      "Password reset successfully! You can now login with your new password.",
    data: { email: admin.email, firstName: admin.firstName },
  });
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  const data = await authService.getCurrentUserService(adminId(req));
  return res.json({ success: true, data });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const input = parse<any>(updateProfileSchema, req.body);
  const data = await authService.updateProfileService(adminId(req), input);
  return res.json({ success: true, data });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = parse<{
    currentPassword: string;
    newPassword: string;
  }>(changePasswordSchema, req.body);

  await authService.changePasswordService(
    adminId(req),
    currentPassword,
    newPassword,
  );
  return res.json({ success: true, message: "Password changed successfully" });
};
