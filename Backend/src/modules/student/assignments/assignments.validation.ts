import { z } from "zod";

export const submitAssignmentSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().optional(),
});

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
