import { z } from "zod";

/**
 * Admin/tutor course management schemas.
 *
 * These replace the inline express-validator chains the admin routes used to
 * carry, so the limits below mirror them one for one: title 1-200, description
 * min 10 on create, price numeric, duration a positive integer.
 */

/** Matches the Prisma `CourseStatus` enum. */
export const courseStatusEnum = z.enum([
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "ARCHIVED",
  "REJECTED",
]);

/**
 * A thumbnail is either a relative CDN key ("images/abc.png") or an absolute
 * URL, depending on where it was uploaded. Both are valid, so this only checks
 * that it is a string — over-constraining here rejects legitimate uploads.
 */
const thumbnail = z.string().trim();

const title = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be at most 200 characters");

const tutorName = z
  .string()
  .trim()
  .min(1, "Tutor name is required")
  .max(100, "Tutor name must be at most 100 characters");

const price = z.coerce.number({ error: "Price must be a number" });

const duration = z.coerce
  .number({ error: "Duration must be a number" })
  .int("Duration must be a whole number")
  .min(1, "Duration must be at least 1");

/** Admin catalogue listing. Defaults match the old handler (page 1, limit 12). */
export const allCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().trim().optional(),
  level: z.string().trim().optional(),
  search: z.string().trim().optional(),
  status: courseStatusEnum.optional(),
});

/**
 * "My courses" listing. `status` stays a free-form string because the frontend
 * sends the literal "ALL" to mean "no status filter".
 */
export const myCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(8),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

/** Tutor directory listing. Defaults match the old handler (limit 10, "all"). */
export const tutorsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().default(""),
  status: z.enum(["all", "active", "inactive"]).default("all"),
});

export const toggleTutorStatusSchema = z.object({
  isActive: z.boolean({ error: "isActive is required" }),
});

export const createCourseSchema = z.object({
  title,
  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters"),
  price: price.default(0),
  duration: duration.optional(),
  level: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  thumbnail: thumbnail.optional(),
  tutorName: tutorName.optional(),
  tutorId: z.string().trim().optional(),
  prerequisites: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  // Accepted for backwards compatibility with the old route; never persisted.
  tags: z.array(z.string()).default([]),
});

/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did. `tutorId` accepts null so
 * an assigned tutor can be cleared.
 */
export const updateCourseSchema = z.object({
  title: title.optional(),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .optional(),
  price: price.optional(),
  duration: duration.optional(),
  level: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  thumbnail: thumbnail.optional(),
  tutorName: tutorName.optional(),
  tutorId: z.string().trim().nullable().optional(),
  status: courseStatusEnum.optional(),
  isPublic: z.boolean().optional(),
  requirements: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
});

/** Rejection reason is optional — the service falls back to a default string. */
export const rejectCourseSchema = z.object({
  reason: z.string().trim().optional(),
});

export type AllCoursesQuery = z.infer<typeof allCoursesQuerySchema>;
export type MyCoursesQuery = z.infer<typeof myCoursesQuerySchema>;
export type TutorsQuery = z.infer<typeof tutorsQuerySchema>;
export type ToggleTutorStatusInput = z.infer<typeof toggleTutorStatusSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type RejectCourseInput = z.infer<typeof rejectCourseSchema>;
