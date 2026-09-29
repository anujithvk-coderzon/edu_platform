import { z } from "zod";

/**
 * Admin/Tutor assignments (Prisma models `assignment` and
 * `assignmentSubmission`).
 *
 * These schemas replace the inline express-validator chains the admin routes
 * used to carry, so the limits below mirror them one for one: title 1-200,
 * description non-empty, `dueDate` an optional ISO-8601 string, and both
 * `maxScore` and `score` non-negative numbers.
 *
 * Every required field carries its own message — without one zod reports
 * "Invalid input: expected string, received undefined" for a missing key, and
 * that string is shown to users.
 */

const title = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be at most 200 characters");

const description = z
  .string({ error: "Description is required" })
  .trim()
  .min(1, "Description is required");

/**
 * `isISO8601()` accepted both full timestamps and bare calendar dates, so the
 * check stays deliberately wide: the shape must look like a date and must
 * actually parse. The handler then feeds it straight to `new Date(...)`.
 */
const ISO_8601_PATTERN =
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

const dueDate = z
  .string()
  .refine(
    (value) => ISO_8601_PATTERN.test(value) && !Number.isNaN(Date.parse(value)),
    "Invalid due date format",
  );

/** Clients post scores as form strings as often as numbers. */
const maxScore = z.coerce
  .number({ error: "Max score must be a positive number" })
  .min(0, "Max score must be a positive number");

const score = z.coerce
  .number({ error: "Score must be a positive number" })
  .min(0, "Score must be a positive number");

export const createAssignmentSchema = z.object({
  title,
  description,
  // Null is allowed through: the handler stores "no due date" as null.
  dueDate: dueDate.nullable().optional(),
  maxScore: maxScore.optional(),
  courseId: z
    .string({ error: "Course ID is required" })
    .min(1, "Course ID is required"),
});

/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did.
 */
export const updateAssignmentSchema = z.object({
  title: title.optional(),
  description: description.optional(),
  dueDate: dueDate.nullable().optional(),
  maxScore: maxScore.optional(),
});

export const gradeSubmissionSchema = z.object({
  score,
  feedback: z.string().trim().nullable().optional(),
});

export const assignmentIdParamSchema = z.object({
  id: z
    .string({ error: "Assignment ID is required" })
    .min(1, "Assignment ID is required"),
});

export const assignmentIdRouteParamSchema = z.object({
  assignmentId: z
    .string({ error: "Assignment ID is required" })
    .min(1, "Assignment ID is required"),
});

export const courseIdParamSchema = z.object({
  courseId: z
    .string({ error: "Course ID is required" })
    .min(1, "Course ID is required"),
});

export const submissionIdParamSchema = z.object({
  submissionId: z
    .string({ error: "Submission ID is required" })
    .min(1, "Submission ID is required"),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type AssignmentIdParam = z.infer<typeof assignmentIdParamSchema>;
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
export type SubmissionIdParam = z.infer<typeof submissionIdParamSchema>;
