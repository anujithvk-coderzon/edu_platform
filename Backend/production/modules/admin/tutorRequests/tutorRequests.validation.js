"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tutorRequestQuerySchema = exports.requestIdParamSchema = void 0;
const zod_1 = require("zod");
/**
 * A tutor request is identified by its cuid in the path. Missing params would
 * otherwise surface as "expected string, received undefined", which reaches the
 * user, so every required field carries its own message.
 */
exports.requestIdParamSchema = zod_1.z.object({
    requestId: zod_1.z
        .string({ error: "Request ID is required" })
        .trim()
        .min(1, "Request ID is required"),
});
/**
 * Optional listing filter. Processed requests are deleted outright, so every
 * stored row is still pending — the value is validated for the API contract but
 * cannot narrow the result set any further.
 */
exports.tutorRequestQuerySchema = zod_1.z.object({
    status: zod_1.z
        .enum(["PENDING", "ACCEPTED", "REJECTED"], {
        error: "Status must be one of PENDING, ACCEPTED or REJECTED",
    })
        .optional(),
});
