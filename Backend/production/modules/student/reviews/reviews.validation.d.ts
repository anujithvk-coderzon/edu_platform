import { z } from "zod";
export declare const submitReviewSchema: z.ZodObject<{
    courseId: z.ZodString;
    rating: z.ZodCoercedNumber<unknown>;
    comment: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const reviewQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;
