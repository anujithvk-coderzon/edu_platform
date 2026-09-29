import { z } from "zod";
/**
 * Admin/tutor course management schemas.
 *
 * These replace the inline express-validator chains the admin routes used to
 * carry, so the limits below mirror them one for one: title 1-200, description
 * min 10 on create, price numeric, duration a positive integer.
 */
/** Matches the Prisma `CourseStatus` enum. */
export declare const courseStatusEnum: z.ZodEnum<{
    PUBLISHED: "PUBLISHED";
    DRAFT: "DRAFT";
    PENDING_REVIEW: "PENDING_REVIEW";
    ARCHIVED: "ARCHIVED";
    REJECTED: "REJECTED";
}>;
/** Admin catalogue listing. Defaults match the old handler (page 1, limit 12). */
export declare const allCoursesQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    category: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        PUBLISHED: "PUBLISHED";
        DRAFT: "DRAFT";
        PENDING_REVIEW: "PENDING_REVIEW";
        ARCHIVED: "ARCHIVED";
        REJECTED: "REJECTED";
    }>>;
}, z.core.$strip>;
/**
 * "My courses" listing. `status` stays a free-form string because the frontend
 * sends the literal "ALL" to mean "no status filter".
 */
export declare const myCoursesQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/** Tutor directory listing. Defaults match the old handler (limit 10, "all"). */
export declare const tutorsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        all: "all";
        active: "active";
        inactive: "inactive";
    }>>;
}, z.core.$strip>;
export declare const toggleTutorStatusSchema: z.ZodObject<{
    isActive: z.ZodBoolean;
}, z.core.$strip>;
export declare const createCourseSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    price: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    duration: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    level: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    thumbnail: z.ZodOptional<z.ZodString>;
    tutorName: z.ZodOptional<z.ZodString>;
    tutorId: z.ZodOptional<z.ZodString>;
    prerequisites: z.ZodDefault<z.ZodArray<z.ZodString>>;
    requirements: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did. `tutorId` accepts null so
 * an assigned tutor can be cleared.
 */
export declare const updateCourseSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    duration: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    level: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    thumbnail: z.ZodOptional<z.ZodString>;
    tutorName: z.ZodOptional<z.ZodString>;
    tutorId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        PUBLISHED: "PUBLISHED";
        DRAFT: "DRAFT";
        PENDING_REVIEW: "PENDING_REVIEW";
        ARCHIVED: "ARCHIVED";
        REJECTED: "REJECTED";
    }>>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
    requirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
    prerequisites: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
/** Rejection reason is optional — the service falls back to a default string. */
export declare const rejectCourseSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AllCoursesQuery = z.infer<typeof allCoursesQuerySchema>;
export type MyCoursesQuery = z.infer<typeof myCoursesQuerySchema>;
export type TutorsQuery = z.infer<typeof tutorsQuerySchema>;
export type ToggleTutorStatusInput = z.infer<typeof toggleTutorStatusSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type RejectCourseInput = z.infer<typeof rejectCourseSchema>;
