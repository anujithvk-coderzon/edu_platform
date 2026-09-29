import { z } from "zod";
export declare const createModuleSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    orderIndex: z.ZodCoercedNumber<unknown>;
    courseId: z.ZodString;
}, z.core.$strip>;
/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did.
 */
export declare const updateModuleSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    orderIndex: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const reorderModuleSchema: z.ZodObject<{
    newOrderIndex: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type ReorderModuleInput = z.infer<typeof reorderModuleSchema>;
