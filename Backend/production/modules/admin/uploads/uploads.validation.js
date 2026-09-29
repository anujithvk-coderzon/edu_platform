"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseIdBodySchema = void 0;
const zod_1 = require("zod");
/**
 * Admin upload endpoints.
 *
 * The only body input these routes carry is an optional `courseId` travelling
 * alongside the multipart file (thumbnail and material uploads). Multipart
 * fields always arrive as strings, and the old handlers only ever did a
 * truthiness check (`if (courseId)`), so a blank string must keep meaning
 * "no course was targeted" rather than becoming a validation failure.
 */
exports.courseIdBodySchema = zod_1.z.object({
    courseId: zod_1.z.string().optional(),
});
