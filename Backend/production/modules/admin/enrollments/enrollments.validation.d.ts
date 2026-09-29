import { z } from "zod";
export declare const enrollmentStatusValues: readonly ["ACTIVE", "COMPLETED", "DROPPED"];
export declare const enrollSchema: z.ZodObject<{
    courseId: z.ZodString;
}, z.core.$strip>;
export declare const updateEnrollmentStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        COMPLETED: "COMPLETED";
        DROPPED: "DROPPED";
    }>;
}, z.core.$strip>;
/**
 * Route params. Kept as plain strings rather than `z.coerce`: coercion would
 * turn a missing param into the literal "undefined" and slip past `min(1)`.
 */
export declare const courseIdParamSchema: z.ZodObject<{
    courseId: z.ZodString;
}, z.core.$strip>;
export declare const enrollmentIdParamSchema: z.ZodObject<{
    enrollmentId: z.ZodString;
}, z.core.$strip>;
export type EnrollInput = z.infer<typeof enrollSchema>;
export type UpdateEnrollmentStatusInput = z.infer<typeof updateEnrollmentStatusSchema>;
export type EnrollmentStatusValue = (typeof enrollmentStatusValues)[number];
