import { z } from "zod";
export declare const enrollmentQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const enrollSchema: z.ZodObject<{
    courseId: z.ZodString;
}, z.core.$strip>;
export type EnrollmentQuery = z.infer<typeof enrollmentQuerySchema>;
