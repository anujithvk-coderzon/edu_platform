"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.studentIdParamSchema = exports.userIdParamSchema = exports.allStudentsQuerySchema = exports.registeredStudentsQuerySchema = void 0;
const zod_1 = require("zod");
/**
 * Every required field carries an explicit `error` message — without it zod
 * reports "Invalid input: expected string, received undefined" for a missing
 * key, and that string reaches the user through `error.details`.
 *
 * Limits mirror the express-validator chains these routes used before
 * (page >= 1, limit 1..100, status one of all|active|blocked, and the
 * ADMIN/STUDENT role list the update chain accepted).
 */
exports.registeredStudentsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    search: zod_1.z.string().default(""),
    status: zod_1.z
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
exports.allStudentsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    search: zod_1.z.string().default(""),
});
/** `:id` on these routes is an Admin record id, not a Student id. */
exports.userIdParamSchema = zod_1.z.object({
    id: zod_1.z
        .string({ error: "User ID is required" })
        .min(1, "User ID is required"),
});
exports.studentIdParamSchema = zod_1.z.object({
    studentId: zod_1.z
        .string({ error: "Student ID is required" })
        .min(1, "Student ID is required"),
});
exports.updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().trim().min(1, "First name is required").optional(),
    lastName: zod_1.z.string().trim().min(1, "Last name is required").optional(),
    role: zod_1.z
        .enum(["ADMIN", "STUDENT"], {
        error: "Role must be one of: ADMIN, STUDENT",
    })
        .optional(),
    isActive: zod_1.z.boolean().optional(),
    isVerified: zod_1.z.boolean().optional(),
});
