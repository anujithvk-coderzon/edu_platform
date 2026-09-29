"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = exports.resetPasswordSchema = exports.verifyForgotOtpSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.oauthLoginSchema = exports.oauthRegisterSchema = exports.resendOtpSchema = exports.verifyOtpSchema = exports.registerSchema = exports.verifyOtpEmailSchema = exports.verifyEmailSchema = exports.checkEmailSchema = void 0;
const zod_1 = require("zod");
const firebase_1 = require("../../../lib/firebase");
/**
 * The routes these replace used express-validator's `normalizeEmail()`, so
 * every stored address is canonical (Gmail dot/tag stripped). Applying the same
 * transform here keeps lookups matching the rows already in the database.
 */
// A missing key produces zod's type error, not the refinement message, so the
// `error` option is set explicitly — these strings are rendered straight to the
// user by the frontend's validation handler.
const email = zod_1.z
    .string({ error: "Email is required" })
    .trim()
    .email("Please provide a valid email address")
    .transform(firebase_1.canonicalizeEmail);
const otp = zod_1.z
    .string({ error: "OTP is required" })
    .trim()
    .length(6, "OTP must be 6 digits");
const password = zod_1.z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters");
const name = zod_1.z.string({ error: "This field is required" }).trim().min(1, "This field is required");
/** Optional profile fields shared by registration and profile update. */
const profileFields = {
    phone: zod_1.z.string().trim().min(1).optional(),
    dateOfBirth: zod_1.z.string().optional(),
    gender: zod_1.z
        .enum(["Male", "Female", "Other", "Prefer not to say"], {
        error: "Please choose a valid option",
    })
        .optional(),
    country: zod_1.z.string().trim().min(1).optional(),
    city: zod_1.z.string().trim().min(1).optional(),
    education: zod_1.z.string().trim().min(1).optional(),
    institution: zod_1.z.string().trim().min(1).optional(),
    occupation: zod_1.z.string().trim().min(1).optional(),
    company: zod_1.z.string().trim().min(1).optional(),
};
exports.checkEmailSchema = zod_1.z.object({ email });
exports.verifyEmailSchema = zod_1.z.object({ email });
exports.verifyOtpEmailSchema = zod_1.z.object({ email, otp });
exports.registerSchema = zod_1.z.object({
    email,
    password,
    firstName: name,
    lastName: name,
    ...profileFields,
});
exports.verifyOtpSchema = zod_1.z.object({ email, otp });
exports.resendOtpSchema = zod_1.z.object({ email });
/**
 * OAuth takes NO email from the client — the address is read from the verified
 * Firebase token. Accepting one here would reopen the identity-spoofing hole.
 */
exports.oauthRegisterSchema = zod_1.z.object({
    provider: zod_1.z.enum(["google", "github"], { error: "Unsupported sign-in provider" }),
    idToken: zod_1.z.string({ error: "Sign-in token is required" }).min(1, "Sign-in token is required"),
    firstName: name,
    lastName: name,
    avatar: zod_1.z.string().optional(),
    ...profileFields,
});
exports.oauthLoginSchema = zod_1.z.object({
    provider: zod_1.z.enum(["google", "github"], { error: "Unsupported sign-in provider" }),
    idToken: zod_1.z.string({ error: "Sign-in token is required" }).min(1, "Sign-in token is required"),
});
exports.loginSchema = zod_1.z.object({
    email,
    password: zod_1.z.string({ error: "Password is required" }).min(1, "Password is required"),
});
exports.forgotPasswordSchema = zod_1.z.object({ email });
exports.verifyForgotOtpSchema = zod_1.z.object({ email, otp });
exports.resetPasswordSchema = zod_1.z.object({
    email,
    otp,
    newPassword: password,
});
exports.updateProfileSchema = zod_1.z.object({
    firstName: name.optional(),
    lastName: name.optional(),
    avatar: zod_1.z.string().optional(),
    ...profileFields,
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z
        .string({ error: "Current password is required" })
        .min(1, "Current password is required"),
    newPassword: password,
});
