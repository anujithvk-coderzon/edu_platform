"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitAssignmentSchema = void 0;
const zod_1 = require("zod");
exports.submitAssignmentSchema = zod_1.z.object({
    content: zod_1.z.string().optional(),
    fileUrl: zod_1.z.string().optional(),
});
