import { z } from "zod";

/**
 * These schemas replace the inline express-validator chains the admin
 * enrollment routes used to carry, so the rules below mirror them one for one:
 * `courseId` / `enrollmentId` must be non-empty, `status` is one of the three
 * Prisma `EnrollmentStatus` values.
 *
 * Every required field carries its own message: without one, a missing key
 * yields "Invalid input: expected string, received undefined", which reaches
 * the user verbatim.
 */

const courseId = z
  .string({ error: "Course ID is required" })
  .min(1, "Course ID is required");

const enrollmentId = z
  .string({ error: "Enrollment ID is required" })
  .min(1, "Enrollment ID is required");

export const enrollmentStatusValues = [
  "ACTIVE",
  "COMPLETED",
  "DROPPED",
] as const;

export const enrollSchema = z.object({
  courseId,
});

export const updateEnrollmentStatusSchema = z.object({
  status: z.enum(enrollmentStatusValues, {
    error: "Status must be one of ACTIVE, COMPLETED or DROPPED",
  }),
});

/**
 * Route params. Kept as plain strings rather than `z.coerce`: coercion would
 * turn a missing param into the literal "undefined" and slip past `min(1)`.
 */
export const courseIdParamSchema = z.object({
  courseId,
});

export const enrollmentIdParamSchema = z.object({
  enrollmentId,
});

export type EnrollInput = z.infer<typeof enrollSchema>;
export type UpdateEnrollmentStatusInput = z.infer<
  typeof updateEnrollmentStatusSchema
>;
export type EnrollmentStatusValue = (typeof enrollmentStatusValues)[number];
