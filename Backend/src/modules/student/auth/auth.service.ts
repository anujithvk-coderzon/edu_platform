import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import prisma from "../../../lib/prisma";
import { generateStudentToken } from "../../../lib/jwt";
import { verifyFirebaseIdToken } from "../../../lib/firebase";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  InternalServerError,
} from "../../../errors/Errors";
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendVerificationEmail,
  StudentWelcomeEmail,
  StoreForgetOtp,
  VerifyForgetOtp,
  ForgetPasswordMail,
  ClearForgetOtp,
} from "../../../lib/email";
import type {
  OAuthRegisterInput,
  RegisterInput,
  UpdateProfileInput,
} from "./auth.validation";

/** Columns returned to the client for a student profile. */
const studentSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  country: true,
  city: true,
  education: true,
  institution: true,
  occupation: true,
  company: true,
  avatar: true,
  isVerified: true,
  createdAt: true,
} as const;

const BCRYPT_ROUNDS = 12;

/** Start a session: rotate the session token, stamp login metadata, sign a JWT. */
const startSession = async (studentId: string, clientIP: string) => {
  const sessionToken = randomUUID();
  await prisma.student.update({
    where: { id: studentId },
    data: {
      activeSessionToken: sessionToken,
      lastLoginAt: new Date(),
      lastLoginIP: clientIP,
    },
  });
  return { sessionToken, token: generateStudentToken(studentId, sessionToken) };
};

const assertEmailAvailable = async (email: string) => {
  const existing = await prisma.student.findUnique({ where: { email } });
  if (existing) {
    throw new BadRequestError("An account with this email already exists");
  }
};

/** Blocked/deactivated checks, in the same order the old handlers used. */
const assertLoginAllowed = (student: {
  blocked: boolean | null;
  isActive: boolean | null;
}) => {
  if (student.blocked) {
    throw new ForbiddenError(
      "Your account has been blocked by the administrator. Please contact support for assistance.",
    );
  }
  if (!student.isActive) {
    throw new ForbiddenError("Account is deactivated");
  }
};

export const checkEmailService = async (email: string) => {
  await assertEmailAvailable(email);
  return { email, available: true };
};

export const sendEmailOtpService = async (email: string) => {
  await assertEmailAvailable(email);

  const otp = generateOTP();
  storeOTP(email, otp, null);
  const result = await sendVerificationEmail(email, otp);
  if (!result.success) {
    throw new InternalServerError(
      result.error || "Failed to send verification email. Please try again.",
    );
  }
  return { email };
};

export const verifyEmailOtpService = (email: string, otp: string) => {
  const verification = verifyOTP(email, otp);
  if (!verification.valid) {
    throw new BadRequestError(
      verification.message || "Invalid or expired OTP. Please try again.",
    );
  }
  return { email, verified: true };
};

/** Registration stores the pending account against the OTP; nothing is created yet. */
export const registerService = async (input: RegisterInput) => {
  await assertEmailAvailable(input.email);

  const otp = generateOTP();
  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  storeOTP(input.email, otp, {
    email: input.email,
    password: hashedPassword,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone || null,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
    gender: input.gender || null,
    country: input.country || null,
    city: input.city || null,
    education: input.education || null,
    institution: input.institution || null,
    occupation: input.occupation || null,
    company: input.company || null,
  });

  const result = await sendVerificationEmail(input.email, otp);
  if (!result.success) {
    throw new InternalServerError(
      result.error || "Failed to send verification email. Please try again.",
    );
  }
  return { email: input.email };
};

/** Confirms the OTP and only then creates the account. */
export const verifyRegistrationOtpService = async (
  email: string,
  otp: string,
  clientIP: string,
) => {
  const verification = verifyOTP(email, otp);
  if (!verification.valid) {
    throw new BadRequestError(
      verification.message || "Invalid or expired OTP. Please try again.",
    );
  }

  const userData = verification.userData;
  const sessionToken = randomUUID();

  const student = await prisma.student.create({
    data: {
      ...userData,
      activeSessionToken: sessionToken,
      lastLoginAt: new Date(),
      lastLoginIP: clientIP,
    },
    select: studentSelect,
  });

  const token = generateStudentToken(student.id, sessionToken);

  // A failed welcome email must not fail the registration.
  try {
    await StudentWelcomeEmail(userData.email, userData.firstName);
  } catch (error) {
    console.error("⚠️ Welcome email error but registration continues:", error);
  }

  return { user: student, token };
};

export const resendOtpService = async (email: string) => {
  const otp = generateOTP();
  const result = await sendVerificationEmail(email, otp);
  if (!result.success) {
    throw new InternalServerError(
      result.error || "Failed to send verification email. Please try again.",
    );
  }
  return { email };
};

/**
 * OAuth registration. The email comes from the verified Firebase token, never
 * from the request — a client-supplied address would let anyone claim an
 * identity they do not own.
 */
export const oauthRegisterService = async (
  input: OAuthRegisterInput,
  clientIP: string,
) => {
  const identity = await verifyFirebaseIdToken(input.idToken);
  await assertEmailAvailable(identity.email);

  const sessionToken = randomUUID();

  const student = await prisma.student.create({
    data: {
      email: identity.email,
      password: null, // OAuth accounts have no password
      firstName: input.firstName,
      lastName: input.lastName,
      avatar: input.avatar || identity.picture || null,
      phone: input.phone || null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender || null,
      country: input.country || null,
      city: input.city || null,
      education: input.education || null,
      institution: input.institution || null,
      occupation: input.occupation || null,
      company: input.company || null,
      isVerified: true, // the provider vouched for the address
      activeSessionToken: sessionToken,
      lastLoginAt: new Date(),
      lastLoginIP: clientIP,
    },
    select: studentSelect,
  });

  const token = generateStudentToken(student.id, sessionToken);

  try {
    await StudentWelcomeEmail(identity.email, input.firstName);
  } catch (error) {
    console.error("⚠️ Welcome email error but registration continues:", error);
  }

  return { user: student, token };
};

export const oauthLoginService = async (idToken: string, clientIP: string) => {
  const identity = await verifyFirebaseIdToken(idToken);

  const student = await prisma.student.findUnique({
    where: { email: identity.email },
  });
  if (!student) {
    throw new NotFoundError("Account not found. Please register first.");
  }
  assertLoginAllowed(student);

  const { token } = await startSession(student.id, clientIP);
  const { password, activeSessionToken, ...rest } = student;

  return { user: { ...rest, hasPassword: !!password }, token };
};

export const loginService = async (
  email: string,
  password: string,
  clientIP: string,
) => {
  const student = await prisma.student.findUnique({ where: { email } });
  if (!student) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (student.blocked) {
    throw new ForbiddenError(
      "Your account has been blocked by the administrator. Please contact support for assistance.",
    );
  }

  if (!student.password) {
    throw new UnauthorizedError(
      "This account uses social login. Please sign in with Google or GitHub.",
    );
  }

  const valid = await bcrypt.compare(password, student.password);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!student.isActive) {
    throw new ForbiddenError("Account is deactivated");
  }

  const { token } = await startSession(student.id, clientIP);
  const {
    password: studentPassword,
    activeSessionToken,
    ...rest
  } = student;

  return { user: { ...rest, hasPassword: !!studentPassword }, token };
};

/** Clearing the session server-side is best-effort: an invalid token still logs out. */
export const logoutService = async (studentId?: string) => {
  if (!studentId) return;
  try {
    await prisma.student.update({
      where: { id: studentId },
      data: { activeSessionToken: null },
    });
  } catch {
    // Account may no longer exist; the cookie is cleared regardless.
  }
};

/** Always reports success, so the endpoint cannot be used to enumerate accounts. */
export const forgotPasswordService = async (email: string) => {
  const student = await prisma.student.findUnique({ where: { email } });
  if (!student) return { email };

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

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const updated = await prisma.student.update({
    where: { email },
    data: { password: hashed },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  ClearForgetOtp(email);
  return { email: updated.email, firstName: updated.firstName };
};

export const getCurrentUserService = async (
  studentId: string,
  sessionToken?: string,
) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      ...studentSelect,
      updatedAt: true,
      activeSessionToken: true,
      password: true,
    },
  });

  if (!student) {
    throw new UnauthorizedError("Student not found.");
  }

  if (sessionToken && student.activeSessionToken !== sessionToken) {
    throw new UnauthorizedError(
      "Session expired. You have been logged in from another device.",
    );
  }

  const { activeSessionToken, password, ...rest } = student;
  return { user: { ...rest, hasPassword: !!password } };
};

export const updateProfileService = async (
  studentId: string,
  input: UpdateProfileInput,
) => {
  const updates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    updates[key] =
      key === "dateOfBirth" ? (value ? new Date(value as string) : null) : value;
  }

  const student = await prisma.student.update({
    where: { id: studentId },
    data: updates,
    select: { ...studentSelect, updatedAt: true, password: true },
  });

  const { password, ...rest } = student;
  return { user: { ...rest, hasPassword: !!password } };
};

export const changePasswordService = async (
  studentId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, password: true },
  });

  if (!student) {
    throw new NotFoundError("Student not found.");
  }

  // OAuth accounts have no password to compare against; bcrypt would throw.
  if (!student.password) {
    throw new BadRequestError(
      "This account uses social login and has no password to change.",
    );
  }

  const valid = await bcrypt.compare(currentPassword, student.password);
  if (!valid) {
    throw new BadRequestError("Current password is incorrect.");
  }

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.student.update({
    where: { id: student.id },
    data: { password: hashed },
  });
};
