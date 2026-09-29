import { z } from "zod";

export const submitReviewSchema = z.object({
  courseId: z
    .string({ error: "Course ID is required" })
    .min(1, "Course ID is required"),
  rating: z.coerce
    .number({ error: "Rating is required" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z.string().trim().optional(),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;
