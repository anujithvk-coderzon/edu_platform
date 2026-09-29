import { z } from "zod";

/**
 * A tutor request is identified by its cuid in the path. Missing params would
 * otherwise surface as "expected string, received undefined", which reaches the
 * user, so every required field carries its own message.
 */
export const requestIdParamSchema = z.object({
  requestId: z
    .string({ error: "Request ID is required" })
    .trim()
    .min(1, "Request ID is required"),
});

/**
 * Optional listing filter. Processed requests are deleted outright, so every
 * stored row is still pending — the value is validated for the API contract but
 * cannot narrow the result set any further.
 */
export const tutorRequestQuerySchema = z.object({
  status: z
    .enum(["PENDING", "ACCEPTED", "REJECTED"], {
      error: "Status must be one of PENDING, ACCEPTED or REJECTED",
    })
    .optional(),
});

export type RequestIdParam = z.infer<typeof requestIdParamSchema>;
export type TutorRequestQuery = z.infer<typeof tutorRequestQuerySchema>;
