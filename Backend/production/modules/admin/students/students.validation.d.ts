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
export declare const registeredStudentsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        blocked: "blocked";
        all: "all";
        active: "active";
    }>>;
}, z.core.$strip>;
/**
 * The aggregation below ignores these — it always returns every student of
 * every visible course — but the route advertised them, so they stay
 * validated rather than silently accepted.
 */
export declare const allStudentsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
/** `:id` on these routes is an Admin record id, not a Student id. */
export declare const userIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const studentIdParamSchema: z.ZodObject<{
    studentId: z.ZodString;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        ADMIN: "ADMIN";
        STUDENT: "STUDENT";
    }>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isVerified: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type RegisteredStudentsQuery = z.infer<typeof registeredStudentsQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
