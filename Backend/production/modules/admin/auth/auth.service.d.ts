import type { RegisterTutorInput, RegisterUserInput, UpdateProfileInput } from "./auth.validation";
/**
 * Creates the very first admin. Disabled permanently once any admin exists —
 * otherwise it would be an open door to full access.
 */
export declare const bootstrapAdminService: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}) => Promise<{
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    };
    token: string;
}>;
/** Staff creation by an existing admin. Accounts are active immediately. */
export declare const registerUserService: (input: RegisterUserInput) => Promise<{
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    };
    userRole: string;
}>;
/** Tutor created by an admin — inactive until explicitly activated. */
export declare const registerTutorService: (input: RegisterTutorInput) => Promise<{
    tutor: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    };
}>;
export declare const checkTutorEmailService: (email: string) => Promise<{
    email: string;
    available: boolean;
}>;
export declare const sendTutorOtpService: (email: string) => Promise<{
    email: string;
}>;
export declare const verifyTutorOtpService: (email: string, otp: string) => {
    email: string;
    verified: boolean;
};
/** Public tutor self-signup: creates a request for an admin to review. */
export declare const registerTutorPublicService: (input: RegisterTutorInput) => Promise<{
    tutorRequest: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
    };
}>;
export declare const loginService: (email: string, password: string) => Promise<{
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        avatar: string | null;
        isVerified: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    token: string;
}>;
/** Always reports success, so the endpoint cannot be used to enumerate accounts. */
export declare const forgotPasswordService: (email: string) => Promise<{
    email: string;
}>;
export declare const verifyForgotOtpService: (email: string, otp: string) => {
    email: string;
    otpVerified: boolean;
};
export declare const resetPasswordService: (email: string, otp: string, newPassword: string) => Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}>;
export declare const getCurrentUserService: (adminId: string) => Promise<{
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        avatar: string;
        isVerified: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const updateProfileService: (adminId: string, input: UpdateProfileInput) => Promise<{
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        avatar: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const changePasswordService: (adminId: string, currentPassword: string, newPassword: string) => Promise<void>;
