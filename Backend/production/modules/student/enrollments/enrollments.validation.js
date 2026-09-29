"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollSchema = exports.enrollmentQuerySchema = void 0;
const zod_1 = require("zod");
exports.enrollmentQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    // The home and my-courses pages pull every enrolment in one call to total up
    // completed courses and hours, so this ceiling has to clear that. The route
    // carried no validation at all before, so a cap is still tighter than it was.
    limit: zod_1.z.coerce.number().int().min(1).max(1000).default(8),
});
exports.enrollSchema = zod_1.z.object({
    courseId: zod_1.z
        .string({ error: "Course ID is required" })
        .min(1, "Course ID is required"),
});
