"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = exports.resetPasswordSchema = exports.verifyOtpSchema = exports.emailOnlySchema = exports.loginSchema = exports.registerTutorSchema = exports.registerUserSchema = exports.bootstrapAdminSchema = void 0;
const zod_1 = require("zod");
const firebase_1 = require("../../../lib/firebase");
/**
 * The routes these replace used express-validator's `normalizeEmail()`, so the
 * same transform is applied here to keep lookups matching stored rows.
 */
const email = zod_1.z
    .string({ error: "Email is required" })
    .trim()
    .email("Please provide a valid email address")
    .transform(firebase_1.canonicalizeEmail);
const password = zod_1.z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters");
const name = zod_1.z.string({ error: "This field is required" }).trim().min(1, "This field is required");
const otp = zod_1.z.string({ error: "OTP is required" }).trim().length(6, "OTP must be 6 digits");
exports.bootstrapAdminSchema = zod_1.z.object({
    email,
    password,
    firstName: name,
    lastName: name,
});
exports.registerUserSchema = zod_1.z.object({
    email,
    password,
    firstName: name,
    lastName: name,
    role: zod_1.z.enum(["Admin", "Tutor"], { error: "Role must be either Admin or Tutor" }).optional(),
});
exports.registerTutorSchema = zod_1.z.object({
    email,
    password,
    firstName: name,
    lastName: name,
});
exports.loginSchema = zod_1.z.object({
    email,
    password: zod_1.z.string({ error: "Password is required" }).min(1, "Password is required"),
});
exports.emailOnlySchema = zod_1.z.object({ email });
exports.verifyOtpSchema = zod_1.z.object({ email, otp });
exports.resetPasswordSchema = zod_1.z.object({
    email,
    otp,
    newPassword: password,
});
exports.updateProfileSchema = zod_1.z.object({
    firstName: name.optional(),
    lastName: name.optional(),
    avatar: zod_1.z.string().trim().optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z
        .string({ error: "Current password is required" })
        .min(1, "Current password is required"),
    newPassword: password,
});
