import { z } from "zod";
/**
 * Every required field carries an explicit `error` message — without it zod
 * reports "Invalid input: expected string, received undefined" for a missing
 * key, and that string reaches the user through `error.details`.
 *
 * Limits mirror the express-validator chains these routes used before
 * (name 1..100, description max 500, `:id` a UUID on update).
 */
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const categoryIdParamSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
