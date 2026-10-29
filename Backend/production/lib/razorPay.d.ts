import Razorpay from "razorpay";
export declare const razorpay: () => Razorpay;
export declare const isValidPaymentSignature: (orderId: string, paymentId: string, signature: string) => boolean;
export declare const isValidWebhookSignature: (rawBody: Buffer, signature: string) => boolean;
