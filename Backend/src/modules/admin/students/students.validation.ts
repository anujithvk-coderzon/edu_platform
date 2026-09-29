import { z } from "zod";

/**
 * Every required field carries an explicit `error` message — without it zod
 * reports "Invalid input: expected string, received undefined" for a missing
 * key, and that string reaches the user through `error.details`.
 *
 * Limits mirror the express-validator chains these routes used before
 * (page >= 1, limit 1..100, status one of all|active|blocked, and the
 * ADMIN/STUDENT role list the update chain accepted).
 */

export const registeredStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().default(""),
  status: z
    .enum(["all", "active", "blocked"], {
      error: "Status must be one of: all, active, blocked",
    })
    .default("all"),
});

/**
 * The aggregation below ignores these — it always returns every student of
 * every visible course — but the route advertised them, so they stay
 * validated rather than silently accepted.
 */
export const allStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().default(""),
});

/** `:id` on these routes is an Admin record id, not a Student id. */
export const userIdParamSchema = z.object({
  id: z
    .string({ error: "User ID is required" })
    .min(1, "User ID is required"),
});

export const studentIdParamSchema = z.object({
  studentId: z
    .string({ error: "Student ID is required" })
    .min(1, "Student ID is required"),
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").optional(),
  lastName: z.string().trim().min(1, "Last name is required").optional(),
  role: z
    .enum(["ADMIN", "STUDENT"], {
      error: "Role must be one of: ADMIN, STUDENT",
    })
    .optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export type RegisteredStudentsQuery = z.infer<
  typeof registeredStudentsQuerySchema
>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
