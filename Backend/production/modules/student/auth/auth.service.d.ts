import type { OAuthRegisterInput, RegisterInput, UpdateProfileInput } from "./auth.validation";
export declare const checkEmailService: (email: string) => Promise<{
    email: string;
    available: boolean;
}>;
export declare const sendEmailOtpService: (email: string) => Promise<{
    email: string;
}>;
export declare const verifyEmailOtpService: (email: string, otp: string) => {
    email: string;
    verified: boolean;
};
/** Registration stores the pending account against the OTP; nothing is created yet. */
export declare const registerService: (input: RegisterInput) => Promise<{
    email: string;
}>;
/** Confirms the OTP and only then creates the account. */
export declare const verifyRegistrationOtpService: (email: string, otp: string, clientIP: string) => Promise<{
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar: string;
        isVerified: boolean;
        createdAt: Date;
        phone: string;
        dateOfBirth: Date;
        gender: string;
        country: string;
        city: string;
        education: string;
        institution: string;
        occupation: string;
        company: string;
    };
    token: string;
}>;
export declare const resendOtpService: (email: string) => Promise<{
    email: string;
}>;
/**
 * OAuth registration. The email comes from the verified Firebase token, never
 * from the request — a client-supplied address would let anyone claim an
 * identity they do not own.
 */
export declare const oauthRegisterService: (input: OAuthRegisterInput, clientIP: string) => Promise<{
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar: string;
        isVerified: boolean;
        createdAt: Date;
        phone: string;
        dateOfBirth: Date;
        gender: string;
        country: string;
        city: string;
        education: string;
        institution: string;
        occupation: string;
        company: string;
    };
    token: string;
}>;
export declare const oauthLoginService: (idToken: string, clientIP: string) => Promise<{
    user: {
        hasPassword: boolean;
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        isVerified: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        dateOfBirth: Date | null;
        gender: string | null;
        country: string | null;
        city: string | null;
        education: string | null;
        institution: string | null;
        occupation: string | null;
        company: string | null;
        blocked: boolean;
        lastLoginAt: Date | null;
        lastLoginIP: string | null;
    };
    token: string;
}>;
export declare const loginService: (email: string, password: string, clientIP: string) => Promise<{
    user: {
        hasPassword: boolean;
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        isVerified: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        dateOfBirth: Date | null;
        gender: string | null;
        country: string | null;
        city: string | null;
        education: string | null;
        institution: string | null;
        occupation: string | null;
        company: string | null;
        blocked: boolean;
        lastLoginAt: Date | null;
        lastLoginIP: string | null;
    };
    token: string;
}>;
/** Clearing the session server-side is best-effort: an invalid token still logs out. */
export declare const logoutService: (studentId?: string) => Promise<void>;
/** Always reports success, so the endpoint cannot be used to enumerate accounts. */
export declare const forgotPasswordService: (email: string) => Promise<{
    email: string;
}>;
export declare const verifyForgotOtpService: (email: string, otp: string) => {
    email: string;
    otpVerified: boolean;
};
export declare const resetPasswordService: (email: string, otp: string, newPassword: string) => Promise<{
    email: string;
    firstName: string;
}>;
export declare const getCurrentUserService: (studentId: string, sessionToken?: string) => Promise<{
    user: {
        hasPassword: boolean;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        dateOfBirth: Date;
        gender: string;
        country: string;
        city: string;
        education: string;
        institution: string;
        occupation: string;
        company: string;
    };
}>;
export declare const updateProfileService: (studentId: string, input: UpdateProfileInput) => Promise<{
    user: {
        hasPassword: boolean;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        dateOfBirth: Date;
        gender: string;
        country: string;
        city: string;
        education: string;
        institution: string;
        occupation: string;
        company: string;
    };
}>;
export declare const changePasswordService: (studentId: string, currentPassword: string, newPassword: string) => Promise<void>;
