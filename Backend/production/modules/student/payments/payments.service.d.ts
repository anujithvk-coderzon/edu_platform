import { VerifyPaymentInput } from './payments.validation';
export declare const createOrderService: (studentId: string, courseId: string) => Promise<{
    orderId: string;
    amount: number;
    currency: string;
    courseTitle: string;
    keyId: string;
}>;
export declare const fulfilPayment: (paymentId: string, razorpayPaymentId: string, signature: string | null) => Promise<{
    enrolled: boolean;
    alreadyProcessed: boolean;
}>;
export declare const verifyPaymentService: (studentId: string, input: VerifyPaymentInput) => Promise<{
    enrolled: boolean;
    alreadyProcessed: boolean;
}>;
