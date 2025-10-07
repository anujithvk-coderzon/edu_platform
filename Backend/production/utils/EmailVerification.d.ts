export declare const generateOTP: () => string;
export declare const storeOTP: (email: any, otp: any, userData: any) => void;
export declare const verifyOTP: (email: any, userEnteredOTP: any) => {
    valid: boolean;
    message: string;
    userData?: undefined;
} | {
    valid: boolean;
    userData: any;
    message: string;
};
export declare const sendVerificationEmail: (email: any, otp: any) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export declare const sendTutorVerificationEmail: (email: any, otp: any) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export declare const sendTutorWelcomeEmail: (email: any, firstname: any) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export declare const StudentWelcomeEmail: (email: string, firstname: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export declare const StaffWelcomeEmail: (email: string, firstname: string, role?: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export declare const StoreForgetOtp: (email: string, otp: string) => void;
export declare const VerifyForgetOtp: (email: string, userEnteredOTP: string) => {
    valid: boolean;
    message: string;
    email?: undefined;
} | {
    valid: boolean;
    email: string;
    message: string;
};
export declare const ClearForgetOtp: (email: string) => void;
export declare const sendTutorPendingApprovalEmail: (email: string, firstName: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export declare const sendTutorRejectionEmail: (email: string, firstName: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export declare const sendCourseRejectionEmail: (email: string, tutorName: string, courseTitle: string, reason: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export declare const sendCoursePublishedEmail: (email: string, tutorName: string, courseTitle: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export declare const ForgetPasswordMail: (email: string, otp: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
