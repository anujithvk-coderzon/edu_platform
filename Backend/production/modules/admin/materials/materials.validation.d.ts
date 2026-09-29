import { z } from "zod";
export declare const createMaterialSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodEnum<{
        LINK: "LINK";
        PDF: "PDF";
        VIDEO: "VIDEO";
    }>;
    fileUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    orderIndex: z.ZodCoercedNumber<unknown>;
    courseId: z.ZodString;
    moduleId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodPipe<z.ZodDefault<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"true">, z.ZodLiteral<"false">]>>, z.ZodTransform<boolean, boolean | "true" | "false">>;
}, z.core.$strip>;
/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did.
 */
export declare const updateMaterialSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<{
        LINK: "LINK";
        PDF: "PDF";
        VIDEO: "VIDEO";
    }>>;
    fileUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    orderIndex: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    moduleId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"true">, z.ZodLiteral<"false">]>>;
}, z.core.$strip>;
export declare const materialIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const courseIdParamSchema: z.ZodObject<{
    courseId: z.ZodString;
}, z.core.$strip>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type MaterialIdParam = z.infer<typeof materialIdParamSchema>;
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
