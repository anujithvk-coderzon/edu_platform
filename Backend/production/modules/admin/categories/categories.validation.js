"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryIdParamSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
/**
 * Every required field carries an explicit `error` message — without it zod
 * reports "Invalid input: expected string, received undefined" for a missing
 * key, and that string reaches the user through `error.details`.
 *
 * Limits mirror the express-validator chains these routes used before
 * (name 1..100, description max 500, `:id` a UUID on update).
 */
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z
        .string({ error: "Name is required" })
        .trim()
        .min(1, "Name is required")
        .max(100, "Name must be at most 100 characters"),
    description: zod_1.z
        .string()
        .trim()
        .max(500, "Description must be at most 500 characters")
        .optional(),
});
exports.updateCategorySchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(1, "Name is required")
        .max(100, "Name must be at most 100 characters")
        .optional(),
    description: zod_1.z
        .string()
        .trim()
        .max(500, "Description must be at most 500 characters")
        .optional(),
});
exports.categoryIdParamSchema = zod_1.z.object({
    id: zod_1.z.uuid({ error: "Category ID must be a valid UUID" }),
});
