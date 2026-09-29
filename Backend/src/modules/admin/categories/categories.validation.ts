import { z } from "zod";

/**
 * Every required field carries an explicit `error` message — without it zod
 * reports "Invalid input: expected string, received undefined" for a missing
 * key, and that string reaches the user through `error.details`.
 *
 * Limits mirror the express-validator chains these routes used before
 * (name 1..100, description max 500, `:id` a UUID on update).
 */
export const createCategorySchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

export const categoryIdParamSchema = z.object({
  id: z.uuid({ error: "Category ID must be a valid UUID" }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
