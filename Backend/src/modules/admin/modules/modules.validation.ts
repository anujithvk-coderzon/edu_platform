import { z } from "zod";

/**
 * "Module" here is a course chapter (Prisma model `courseModule`).
 *
 * These schemas replace the inline express-validator chains the routes used to
 * carry, so the limits below mirror them one for one: title 1-200,
 * description max 1000, order indexes are non-negative integers.
 */

const title = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be at most 200 characters");

const description = z
  .string()
  .trim()
  .max(1000, "Description must be at most 1000 characters");

const orderIndex = z.coerce
  .number({ error: "Order index is required" })
  .int("Order index must be a whole number")
  .min(0, "Order index must be 0 or greater");

export const createModuleSchema = z.object({
  title,
  description: description.optional(),
  orderIndex,
  courseId: z
    .string({ error: "Course ID is required" })
    .min(1, "Course ID is required"),
});

/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did.
 */
export const updateModuleSchema = z.object({
  title: title.optional(),
  description: description.optional(),
  orderIndex: orderIndex.optional(),
});

export const reorderModuleSchema = z.object({
  newOrderIndex: z.coerce
    .number({ error: "New order index is required" })
    .int("New order index must be a whole number")
    .min(0, "New order index must be 0 or greater"),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type ReorderModuleInput = z.infer<typeof reorderModuleSchema>;
