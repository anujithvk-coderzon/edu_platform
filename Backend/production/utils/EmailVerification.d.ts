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
export declare const WelcomeEmail: (email: any, firstname: any) => Promise<{
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
export declare const ForgetPasswordMail: (email: string, otp: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
