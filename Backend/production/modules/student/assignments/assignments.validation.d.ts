import { z } from "zod";
export declare const submitAssignmentSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    fileUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
