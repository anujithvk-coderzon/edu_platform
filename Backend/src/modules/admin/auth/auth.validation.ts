import { z } from "zod";
import { canonicalizeEmail } from "../../../lib/firebase";

/**
 * The routes these replace used express-validator's `normalizeEmail()`, so the
 * same transform is applied here to keep lookups matching stored rows.
 */
const email = z
  .string({ error: "Email is required" })
  .trim()
  .email("Please provide a valid email address")
  .transform(canonicalizeEmail);

const password = z
  .string({ error: "Password is required" })
  .min(6, "Password must be at least 6 characters");

const name = z.string({ error: "This field is required" }).trim().min(1, "This field is required");
const otp = z.string({ error: "OTP is required" }).trim().length(6, "OTP must be 6 digits");

export const bootstrapAdminSchema = z.object({
  email,
  password,
  firstName: name,
  lastName: name,
});

export const registerUserSchema = z.object({
  email,
  password,
  firstName: name,
  lastName: name,
  role: z.enum(["Admin", "Tutor"], { error: "Role must be either Admin or Tutor" }).optional(),
});

export const registerTutorSchema = z.object({
  email,
  password,
  firstName: name,
  lastName: name,
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const emailOnlySchema = z.object({ email });

export const verifyOtpSchema = z.object({ email, otp });

export const resetPasswordSchema = z.object({
  email,
  otp,
  newPassword: password,
});

export const updateProfileSchema = z.object({
  firstName: name.optional(),
  lastName: name.optional(),
  avatar: z.string().trim().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ error: "Current password is required" })
    .min(1, "Current password is required"),
  newPassword: password,
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type RegisterTutorInput = z.infer<typeof registerTutorSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
