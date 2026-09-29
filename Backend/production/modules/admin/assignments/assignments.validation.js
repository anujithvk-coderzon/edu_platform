"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionIdParamSchema = exports.courseIdParamSchema = exports.assignmentIdRouteParamSchema = exports.assignmentIdParamSchema = exports.gradeSubmissionSchema = exports.updateAssignmentSchema = exports.createAssignmentSchema = void 0;
const zod_1 = require("zod");
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
const title = zod_1.z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters");
const description = zod_1.z
    .string({ error: "Description is required" })
    .trim()
    .min(1, "Description is required");
/**
 * `isISO8601()` accepted both full timestamps and bare calendar dates, so the
 * check stays deliberately wide: the shape must look like a date and must
 * actually parse. The handler then feeds it straight to `new Date(...)`.
 */
const ISO_8601_PATTERN = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const dueDate = zod_1.z
    .string()
    .refine((value) => ISO_8601_PATTERN.test(value) && !Number.isNaN(Date.parse(value)), "Invalid due date format");
/** Clients post scores as form strings as often as numbers. */
const maxScore = zod_1.z.coerce
    .number({ error: "Max score must be a positive number" })
    .min(0, "Max score must be a positive number");
const score = zod_1.z.coerce
    .number({ error: "Score must be a positive number" })
    .min(0, "Score must be a positive number");
exports.createAssignmentSchema = zod_1.z.object({
    title,
    description,
    // Null is allowed through: the handler stores "no due date" as null.
    dueDate: dueDate.nullable().optional(),
    maxScore: maxScore.optional(),
    courseId: zod_1.z
        .string({ error: "Course ID is required" })
        .min(1, "Course ID is required"),
});
/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did.
 */
exports.updateAssignmentSchema = zod_1.z.object({
    title: title.optional(),
    description: description.optional(),
    dueDate: dueDate.nullable().optional(),
    maxScore: maxScore.optional(),
});
exports.gradeSubmissionSchema = zod_1.z.object({
    score,
    feedback: zod_1.z.string().trim().nullable().optional(),
});
exports.assignmentIdParamSchema = zod_1.z.object({
    id: zod_1.z
        .string({ error: "Assignment ID is required" })
        .min(1, "Assignment ID is required"),
});
exports.assignmentIdRouteParamSchema = zod_1.z.object({
    assignmentId: zod_1.z
        .string({ error: "Assignment ID is required" })
        .min(1, "Assignment ID is required"),
});
exports.courseIdParamSchema = zod_1.z.object({
    courseId: zod_1.z
        .string({ error: "Course ID is required" })
        .min(1, "Course ID is required"),
});
exports.submissionIdParamSchema = zod_1.z.object({
    submissionId: zod_1.z
        .string({ error: "Submission ID is required" })
        .min(1, "Submission ID is required"),
});
