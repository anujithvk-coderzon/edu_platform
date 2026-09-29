import { z } from "zod";
export declare const checkEmailSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const verifyEmailSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const verifyOtpEmailSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    otp: z.ZodString;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<{
        Male: "Male";
        Female: "Female";
        Other: "Other";
        "Prefer not to say": "Prefer not to say";
    }>>;
    country: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    education: z.ZodOptional<z.ZodString>;
    institution: z.ZodOptional<z.ZodString>;
    occupation: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
}, z.core.$strip>;
export declare const verifyOtpSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    otp: z.ZodString;
}, z.core.$strip>;
export declare const resendOtpSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
/**
 * OAuth takes NO email from the client — the address is read from the verified
 * Firebase token. Accepting one here would reopen the identity-spoofing hole.
 */
export declare const oauthRegisterSchema: z.ZodObject<{
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<{
        Male: "Male";
        Female: "Female";
        Other: "Other";
        "Prefer not to say": "Prefer not to say";
    }>>;
    country: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    education: z.ZodOptional<z.ZodString>;
    institution: z.ZodOptional<z.ZodString>;
    occupation: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    provider: z.ZodEnum<{
        google: "google";
        github: "github";
    }>;
    idToken: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    avatar: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const oauthLoginSchema: z.ZodObject<{
    provider: z.ZodEnum<{
        google: "google";
        github: "github";
    }>;
    idToken: z.ZodString;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodString;
}, z.core.$strip>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const verifyForgotOtpSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    otp: z.ZodString;
}, z.core.$strip>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    otp: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const updateProfileSchema: z.ZodObject<{
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<{
        Male: "Male";
        Female: "Female";
        Other: "Other";
        "Prefer not to say": "Prefer not to say";
    }>>;
    country: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    education: z.ZodOptional<z.ZodString>;
    institution: z.ZodOptional<z.ZodString>;
    occupation: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OAuthRegisterInput = z.infer<typeof oauthRegisterSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
