import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../../../errors/Errors";
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  StoreForgetOtp,
  VerifyForgetOtp,
  ForgetPasswordMail,
  ClearForgetOtp,
  sendTutorVerificationEmail,
  sendTutorPendingApprovalEmail,
  StaffWelcomeEmail,
} from "../../../lib/email";
import { generateAdminToken } from "../../../lib/jwt";
import type {
  RegisterTutorInput,
  RegisterUserInput,
  UpdateProfileInput,
} from "./auth.validation";

const BCRYPT_ROUNDS = 12;

/** Columns returned to the client for a staff account. */
const staffSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

const assertEmailAvailable = async (email: string) => {
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    throw new BadRequestError("User already exists with this email");
  }
};

/**
 * Creates the very first admin. Disabled permanently once any admin exists —
 * otherwise it would be an open door to full access.
 */
export const bootstrapAdminService = async (input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  const adminExists = await prisma.admin.findFirst();
  if (adminExists) {
    throw new ForbiddenError(
      "Bootstrap endpoint is disabled. First admin has already been created.",
    );
  }

  const existing = await prisma.admin.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new BadRequestError("Admin already exists with this email");
  }

  const user = await prisma.admin.create({
    data: {
      email: input.email,
      password: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      firstName: input.firstName,
      lastName: input.lastName,
      role: "Admin",
      isActive: true,
    },
    select: staffSelect,
  });

  return { user, token: generateAdminToken(user.id) };
};

/** Staff creation by an existing admin. Accounts are active immediately. */
export const registerUserService = async (input: RegisterUserInput) => {
  const userRole = input.role === "Admin" ? "Admin" : "Tutor";

  await assertEmailAvailable(input.email);

  const user = await prisma.admin.create({
    data: {
      email: input.email,
      password: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      firstName: input.firstName,
      lastName: input.lastName,
      role: userRole,
      isActive: true,
      isVerified: true,
    },
    select: staffSelect,
  });

  // A failed welcome email must not fail the account creation.
  const emailResult = await StaffWelcomeEmail(
    input.email,
    input.firstName,
    userRole,
  );
  if (!emailResult.success) {
    console.error("Failed to send welcome email:", emailResult.error);
  }

  return { user, userRole };
};

/** Tutor created by an admin — inactive until explicitly activated. */
export const registerTutorService = async (input: RegisterTutorInput) => {
  await assertEmailAvailable(input.email);

  const tutor = await prisma.admin.create({
    data: {
      email: input.email,
      password: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      firstName: input.firstName,
      lastName: input.lastName,
      role: "Tutor",
      isActive: false,
    },
    select: staffSelect,
  });

  return { tutor };
};

export const checkTutorEmailService = async (email: string) => {
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    throw new BadRequestError("An account with this email already exists");
  }
  return { email, available: true };
};

export const sendTutorOtpService = async (email: string) => {
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (existingAdmin) {
    throw new BadRequestError(
      "An account with this email already exists. Please login instead.",
    );
  }

  const existingRequest = await prisma.tutorRequest.findUnique({
    where: { email },
  });
  if (existingRequest) {
    throw new BadRequestError(
      "A registration request with this email is already pending approval. Please wait for admin review.",
    );
  }

  const otp = generateOTP();
  storeOTP(email, otp, null);

  const result = await sendTutorVerificationEmail(email, otp);
  if (!result.success) {
    throw new InternalServerError(
      result.error || "Failed to send verification email. Please try again.",
    );
  }
  return { email };
};

export const verifyTutorOtpService = (email: string, otp: string) => {
  const verification = verifyOTP(email, otp);
  if (!verification.valid) {
    throw new BadRequestError(
      verification.message || "Invalid or expired OTP. Please try again.",
    );
  }
  return { email, verified: true };
};

/** Public tutor self-signup: creates a request for an admin to review. */
export const registerTutorPublicService = async (
  input: RegisterTutorInput,
) => {
  await assertEmailAvailable(input.email);

  const existingRequest = await prisma.tutorRequest.findUnique({
    where: { email: input.email },
  });
  if (existingRequest) {
    throw new BadRequestError(
      "A registration request with this email is already pending approval",
    );
  }

  const tutorRequest = await prisma.tutorRequest.create({
    data: {
      email: input.email,
      password: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      firstName: input.firstName,
      lastName: input.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  const emailResult = await sendTutorPendingApprovalEmail(
    input.email,
    input.firstName,
  );
  if (!emailResult.success) {
    console.error(
      "Failed to send pending approval email:",
      emailResult.error,
    );
  }

  return { tutorRequest };
};

export const loginService = async (email: string, password: string) => {
  const user = await prisma.admin.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedError("Invalid email or password");
  }
  if (!user.isActive) {
    throw new ForbiddenError("Account is deactivated");
  }

  const { password: _password, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token: generateAdminToken(user.id) };
};

/** Always reports success, so the endpoint cannot be used to enumerate accounts. */
export const forgotPasswordService = async (email: string) => {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return { email };

  const otp = generateOTP();
  StoreForgetOtp(email, otp);

  const result = await ForgetPasswordMail(email, otp);
  if (!result.success) {
    throw new InternalServerError(
      result.error || "Failed to send password reset email. Please try again.",
    );
  }
  return { email };
};

export const verifyForgotOtpService = (email: string, otp: string) => {
  const verification = VerifyForgetOtp(email, otp);
  if (!verification.valid) {
    throw new BadRequestError(
      verification.message || "Invalid or expired OTP. Please try again.",
    );
  }
  return { email, otpVerified: true };
};

export const resetPasswordService = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const verification = VerifyForgetOtp(email, otp);
  if (!verification.valid) {
    throw new BadRequestError(
      verification.message ||
        "Invalid or expired OTP. Please request a new password reset.",
    );
  }

  const updated = await prisma.admin.update({
    where: { email },
    data: { password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  ClearForgetOtp(email);
  return updated;
};

export const getCurrentUserService = async (adminId: string) => {
  const user = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { ...staffSelect, avatar: true, isVerified: true, updatedAt: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }
  return { user };
};

export const updateProfileService = async (
  adminId: string,
  input: UpdateProfileInput,
) => {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) updates[key] = value;
  }

  const user = await prisma.admin.update({
    where: { id: adminId },
    data: updates,
    select: { ...staffSelect, avatar: true, updatedAt: true },
  });

  return { user };
};

export const changePasswordService = async (
  adminId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    throw new BadRequestError("Current password is incorrect");
  }

  await prisma.admin.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
  });
};
