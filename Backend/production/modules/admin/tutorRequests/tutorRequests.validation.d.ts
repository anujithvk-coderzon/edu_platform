import { z } from "zod";
/**
 * A tutor request is identified by its cuid in the path. Missing params would
 * otherwise surface as "expected string, received undefined", which reaches the
 * user, so every required field carries its own message.
 */
export declare const requestIdParamSchema: z.ZodObject<{
    requestId: z.ZodString;
}, z.core.$strip>;
/**
 * Optional listing filter. Processed requests are deleted outright, so every
 * stored row is still pending — the value is validated for the API contract but
 * cannot narrow the result set any further.
 */
export declare const tutorRequestQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        REJECTED: "REJECTED";
        PENDING: "PENDING";
        ACCEPTED: "ACCEPTED";
    }>>;
}, z.core.$strip>;
export type RequestIdParam = z.infer<typeof requestIdParamSchema>;
export type TutorRequestQuery = z.infer<typeof tutorRequestQuerySchema>;
