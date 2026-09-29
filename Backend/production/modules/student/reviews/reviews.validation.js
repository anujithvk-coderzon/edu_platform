"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewQuerySchema = exports.submitReviewSchema = void 0;
const zod_1 = require("zod");
exports.submitReviewSchema = zod_1.z.object({
    courseId: zod_1.z
        .string({ error: "Course ID is required" })
        .min(1, "Course ID is required"),
    rating: zod_1.z.coerce
        .number({ error: "Rating is required" })
        .int("Rating must be a whole number")
        .min(1, "Rating must be between 1 and 5")
        .max(5, "Rating must be between 1 and 5"),
    comment: zod_1.z.string().trim().optional(),
});
exports.reviewQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
});
