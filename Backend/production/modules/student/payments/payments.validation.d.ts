import z from "zod";
export declare const createOrderSchema: z.ZodObject<{
    courseId: z.ZodString;
}, z.core.$strip>;
export declare const verifyPaymentSchema: z.ZodObject<{
    razorpay_order_id: z.ZodString;
    razorpay_payment_id: z.ZodString;
    razorpay_signature: z.ZodString;
}, z.core.$strip>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
