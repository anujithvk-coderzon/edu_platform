"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectCourseSchema = exports.updateCourseSchema = exports.createCourseSchema = exports.toggleTutorStatusSchema = exports.tutorsQuerySchema = exports.myCoursesQuerySchema = exports.allCoursesQuerySchema = exports.courseStatusEnum = void 0;
const zod_1 = require("zod");
/**
 * Admin/tutor course management schemas.
 *
 * These replace the inline express-validator chains the admin routes used to
 * carry, so the limits below mirror them one for one: title 1-200, description
 * min 10 on create, price numeric, duration a positive integer.
 */
/** Matches the Prisma `CourseStatus` enum. */
exports.courseStatusEnum = zod_1.z.enum([
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
const thumbnail = zod_1.z.string().trim();
const title = zod_1.z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters");
const tutorName = zod_1.z
    .string()
    .trim()
    .min(1, "Tutor name is required")
    .max(100, "Tutor name must be at most 100 characters");
const price = zod_1.z.coerce.number({ error: "Price must be a number" });
const duration = zod_1.z.coerce
    .number({ error: "Duration must be a number" })
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1");
/** Admin catalogue listing. Defaults match the old handler (page 1, limit 12). */
exports.allCoursesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(12),
    category: zod_1.z.string().trim().optional(),
    level: zod_1.z.string().trim().optional(),
    search: zod_1.z.string().trim().optional(),
    status: exports.courseStatusEnum.optional(),
});
/**
 * "My courses" listing. `status` stays a free-form string because the frontend
 * sends the literal "ALL" to mean "no status filter".
 */
exports.myCoursesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(8),
    search: zod_1.z.string().trim().optional(),
    status: zod_1.z.string().trim().optional(),
});
/** Tutor directory listing. Defaults match the old handler (limit 10, "all"). */
exports.tutorsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    search: zod_1.z.string().trim().default(""),
    status: zod_1.z.enum(["all", "active", "inactive"]).default("all"),
});
exports.toggleTutorStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean({ error: "isActive is required" }),
});
exports.createCourseSchema = zod_1.z.object({
    title,
    description: zod_1.z
        .string({ error: "Description is required" })
        .trim()
        .min(10, "Description must be at least 10 characters"),
    price: price.default(0),
    duration: duration.optional(),
    level: zod_1.z.string().trim().optional(),
    categoryId: zod_1.z.string().trim().optional(),
    thumbnail: thumbnail.optional(),
    tutorName: tutorName.optional(),
    tutorId: zod_1.z.string().trim().optional(),
    prerequisites: zod_1.z.array(zod_1.z.string()).default([]),
    requirements: zod_1.z.array(zod_1.z.string()).default([]),
    // Accepted for backwards compatibility with the old route; never persisted.
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did. `tutorId` accepts null so
 * an assigned tutor can be cleared.
 */
exports.updateCourseSchema = zod_1.z.object({
    title: title.optional(),
    description: zod_1.z
        .string()
        .trim()
        .min(1, "Description is required")
        .optional(),
    price: price.optional(),
    duration: duration.optional(),
    level: zod_1.z.string().trim().optional(),
    categoryId: zod_1.z.string().trim().optional(),
    thumbnail: thumbnail.optional(),
    tutorName: tutorName.optional(),
    tutorId: zod_1.z.string().trim().nullable().optional(),
    status: exports.courseStatusEnum.optional(),
    isPublic: zod_1.z.boolean().optional(),
    requirements: zod_1.z.array(zod_1.z.string()).optional(),
    prerequisites: zod_1.z.array(zod_1.z.string()).optional(),
});
/** Rejection reason is optional — the service falls back to a default string. */
exports.rejectCourseSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().optional(),
});
