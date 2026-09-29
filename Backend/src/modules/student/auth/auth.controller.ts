import type { Request, Response } from "express";
import { sessionCookieOptions, verifyStudentToken } from "../../../lib/jwt";
import { getStudentToken } from "../../../lib/authToken";
import { UnauthorizedError } from "../../../errors/Errors";
import type { AuthRequest } from "../../../middlewares/auth";
import * as authService from "./auth.service";
import {
  changePasswordSchema,
  checkEmailSchema,
  forgotPasswordSchema,
  loginSchema,
  oauthLoginSchema,
  oauthRegisterSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  verifyForgotOtpSchema,
  verifyOtpEmailSchema,
  verifyOtpSchema,
} from "./auth.validation";

/**
 * Controllers are HTTP-only: parse the request, call a service, shape the
 * response. They never touch Prisma and never try/catch — Express 5 forwards
 * thrown errors (and rejected promises) to errorHandler.
 *
 * The `{ success, data }` envelope is preserved exactly: both frontends branch
 * on `success`, so it is API contract rather than style.
 */

const clientIP = (req: Request): string =>
  (req.ip || (req.headers["x-forwarded-for"] as string) || "unknown") as string;

const parse = <T>(schema: { safeParse: (v: unknown) => any }, body: unknown): T => {
  const result = schema.safeParse(body);
  if (!result.success) throw result.error;
  return result.data as T;
};

/** The route's authMiddleware has already validated the caller. */
const requireStudentId = (req: AuthRequest): string => {
  if (req.user?.id) return req.user.id;

  // Defensive: a route mounted without authMiddleware would land here.
  const token = getStudentToken(req);
  const decoded = token ? verifyStudentToken(token) : null;
  if (!decoded?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return decoded.id;
};

export const checkEmail = async (req: Request, res: Response) => {
  const { email } = parse<{ email: string }>(checkEmailSchema, req.body);
  const data = await authService.checkEmailService(email);
  return res
    .status(200)
    .json({ success: true, message: "Email is available", data });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { email } = parse<{ email: string }>(verifyEmailSchema, req.body);
  const data = await authService.sendEmailOtpService(email);
  return res.status(200).json({
    success: true,
    message: "Verification code sent to your email. Please check your inbox.",
    data,
  });
};

export const verifyOtpEmail = async (req: Request, res: Response) => {
  const { email, otp } = parse<{ email: string; otp: string }>(
    verifyOtpEmailSchema,
    req.body,
  );
  const data = authService.verifyEmailOtpService(email, otp);
  return res.status(200).json({
    success: true,
    message:
      "Email verified successfully! You can now complete your registration.",
    data,
  });
};

export const register = async (req: Request, res: Response) => {
  const input = parse<any>(registerSchema, req.body);
  const data = await authService.registerService(input);
  return res.status(200).json({
    success: true,
    message: "OTP sent to your email. Please verify to complete registration.",
    data,
  });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = parse<{ email: string; otp: string }>(
    verifyOtpSchema,
    req.body,
  );
  const { user, token } = await authService.verifyRegistrationOtpService(
    email,
    otp,
    clientIP(req),
  );

  res.cookie("student_token", token, sessionCookieOptions());
  return res.status(201).json({
    success: true,
    message: "Email verified successfully. Account created!",
    data: { user, token },
  });
};

export const resendOtp = async (req: Request, res: Response) => {
  const { email } = parse<{ email: string }>(resendOtpSchema, req.body);
  const data = await authService.resendOtpService(email);
  return res
    .status(200)
    .json({ success: true, message: "New OTP sent to your email.", data });
};

export const oauthRegister = async (req: Request, res: Response) => {
  const input = parse<any>(oauthRegisterSchema, req.body);
  const { user, token } = await authService.oauthRegisterService(
    input,
    clientIP(req),
  );

  res.cookie("student_token", token, sessionCookieOptions());
  return res.status(201).json({
    success: true,
    message: "Registration successful! Welcome aboard!",
    data: { user, token },
  });
};

export const oauthLogin = async (req: Request, res: Response) => {
  const { idToken } = parse<{ idToken: string }>(oauthLoginSchema, req.body);
  const { user, token } = await authService.oauthLoginService(
    idToken,
    clientIP(req),
  );

  res.cookie("student_token", token, sessionCookieOptions());
  return res
    .status(200)
    .json({ success: true, message: "Login successful!", data: { user, token } });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = parse<{ email: string; password: string }>(
    loginSchema,
    req.body,
  );
  const { user, token } = await authService.loginService(
    email,
    password,
    clientIP(req),
  );

  res.cookie("student_token", token, sessionCookieOptions());
  return res.json({ success: true, data: { user, token } });
};

export const logout = async (req: Request, res: Response) => {
  const token = getStudentToken(req);
  const decoded = token ? verifyStudentToken(token) : null;

  await authService.logoutService(decoded?.id);

  const { maxAge, ...clearOptions } = sessionCookieOptions();
  res.clearCookie("student_token", { ...clearOptions, path: "/" });
  return res.json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = parse<{ email: string }>(forgotPasswordSchema, req.body);
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
    verifyForgotOtpSchema,
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

  const data = await authService.resetPasswordService(email, otp, newPassword);
  return res.status(200).json({
    success: true,
    message:
      "Password reset successfully! You can now login with your new password.",
    data,
  });
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  const token = getStudentToken(req);
  const decoded = token ? verifyStudentToken(token) : null;

  const data = await authService.getCurrentUserService(
    requireStudentId(req),
    decoded?.sessionToken,
  );
  return res.json({ success: true, data });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const input = parse<any>(updateProfileSchema, req.body);
  const data = await authService.updateProfileService(
    requireStudentId(req),
    input,
  );
  return res.json({ success: true, data });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = parse<{
    currentPassword: string;
    newPassword: string;
  }>(changePasswordSchema, req.body);

  await authService.changePasswordService(
    requireStudentId(req),
    currentPassword,
    newPassword,
  );
  return res.json({
    success: true,
    message: "Password changed successfully!",
  });
};
