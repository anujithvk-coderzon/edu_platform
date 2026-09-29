"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentIdParamSchema = exports.courseIdParamSchema = exports.updateEnrollmentStatusSchema = exports.enrollSchema = exports.enrollmentStatusValues = void 0;
const zod_1 = require("zod");
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
const courseId = zod_1.z
    .string({ error: "Course ID is required" })
    .min(1, "Course ID is required");
const enrollmentId = zod_1.z
    .string({ error: "Enrollment ID is required" })
    .min(1, "Enrollment ID is required");
exports.enrollmentStatusValues = [
    "ACTIVE",
    "COMPLETED",
    "DROPPED",
];
exports.enrollSchema = zod_1.z.object({
    courseId,
});
exports.updateEnrollmentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(exports.enrollmentStatusValues, {
        error: "Status must be one of ACTIVE, COMPLETED or DROPPED",
    }),
});
/**
 * Route params. Kept as plain strings rather than `z.coerce`: coercion would
 * turn a missing param into the literal "undefined" and slip past `min(1)`.
 */
exports.courseIdParamSchema = zod_1.z.object({
    courseId,
});
exports.enrollmentIdParamSchema = zod_1.z.object({
    enrollmentId,
});
