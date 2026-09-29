import { z } from "zod";
/**
 * Admin upload endpoints.
 *
 * The only body input these routes carry is an optional `courseId` travelling
 * alongside the multipart file (thumbnail and material uploads). Multipart
 * fields always arrive as strings, and the old handlers only ever did a
 * truthiness check (`if (courseId)`), so a blank string must keep meaning
 * "no course was targeted" rather than becoming a validation failure.
 */
export declare const courseIdBodySchema: z.ZodObject<{
    courseId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CourseIdBodyInput = z.infer<typeof courseIdBodySchema>;
