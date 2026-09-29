import { z } from "zod";
import { canonicalizeEmail } from "../../../lib/firebase";

/**
 * The routes these replace used express-validator's `normalizeEmail()`, so
 * every stored address is canonical (Gmail dot/tag stripped). Applying the same
 * transform here keeps lookups matching the rows already in the database.
 */
// A missing key produces zod's type error, not the refinement message, so the
// `error` option is set explicitly — these strings are rendered straight to the
// user by the frontend's validation handler.
const email = z
  .string({ error: "Email is required" })
  .trim()
  .email("Please provide a valid email address")
  .transform(canonicalizeEmail);

const otp = z
  .string({ error: "OTP is required" })
  .trim()
  .length(6, "OTP must be 6 digits");

const password = z
  .string({ error: "Password is required" })
  .min(6, "Password must be at least 6 characters");

const name = z.string({ error: "This field is required" }).trim().min(1, "This field is required");

/** Optional profile fields shared by registration and profile update. */
const profileFields = {
  phone: z.string().trim().min(1).optional(),
  dateOfBirth: z.string().optional(),
  gender: z
    .enum(["Male", "Female", "Other", "Prefer not to say"], {
      error: "Please choose a valid option",
    })
    .optional(),
  country: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  education: z.string().trim().min(1).optional(),
  institution: z.string().trim().min(1).optional(),
  occupation: z.string().trim().min(1).optional(),
  company: z.string().trim().min(1).optional(),
};

export const checkEmailSchema = z.object({ email });

export const verifyEmailSchema = z.object({ email });

export const verifyOtpEmailSchema = z.object({ email, otp });

export const registerSchema = z.object({
  email,
  password,
  firstName: name,
  lastName: name,
  ...profileFields,
});

export const verifyOtpSchema = z.object({ email, otp });

export const resendOtpSchema = z.object({ email });

/**
 * OAuth takes NO email from the client — the address is read from the verified
 * Firebase token. Accepting one here would reopen the identity-spoofing hole.
 */
export const oauthRegisterSchema = z.object({
  provider: z.enum(["google", "github"], { error: "Unsupported sign-in provider" }),
  idToken: z.string({ error: "Sign-in token is required" }).min(1, "Sign-in token is required"),
  firstName: name,
  lastName: name,
  avatar: z.string().optional(),
  ...profileFields,
});

export const oauthLoginSchema = z.object({
  provider: z.enum(["google", "github"], { error: "Unsupported sign-in provider" }),
  idToken: z.string({ error: "Sign-in token is required" }).min(1, "Sign-in token is required"),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({ email });

export const verifyForgotOtpSchema = z.object({ email, otp });

export const resetPasswordSchema = z.object({
  email,
  otp,
  newPassword: password,
});

export const updateProfileSchema = z.object({
  firstName: name.optional(),
  lastName: name.optional(),
  avatar: z.string().optional(),
  ...profileFields,
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ error: "Current password is required" })
    .min(1, "Current password is required"),
  newPassword: password,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type OAuthRegisterInput = z.infer<typeof oauthRegisterSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
