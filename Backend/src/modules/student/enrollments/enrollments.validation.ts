import { z } from "zod";

export const enrollmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  // The home and my-courses pages pull every enrolment in one call to total up
  // completed courses and hours, so this ceiling has to clear that. The route
  // carried no validation at all before, so a cap is still tighter than it was.
  limit: z.coerce.number().int().min(1).max(1000).default(8),
});

export const enrollSchema = z.object({
  courseId: z
    .string({ error: "Course ID is required" })
    .min(1, "Course ID is required"),
});

export type EnrollmentQuery = z.infer<typeof enrollmentQuerySchema>;
