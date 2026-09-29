import { z } from "zod";
export declare const createAssignmentSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    maxScore: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    courseId: z.ZodString;
}, z.core.$strip>;
/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did.
 */
export declare const updateAssignmentSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    maxScore: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const gradeSubmissionSchema: z.ZodObject<{
    score: z.ZodCoercedNumber<unknown>;
    feedback: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const assignmentIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const assignmentIdRouteParamSchema: z.ZodObject<{
    assignmentId: z.ZodString;
}, z.core.$strip>;
export declare const courseIdParamSchema: z.ZodObject<{
    courseId: z.ZodString;
}, z.core.$strip>;
export declare const submissionIdParamSchema: z.ZodObject<{
    submissionId: z.ZodString;
}, z.core.$strip>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type AssignmentIdParam = z.infer<typeof assignmentIdParamSchema>;
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
export type SubmissionIdParam = z.infer<typeof submissionIdParamSchema>;
