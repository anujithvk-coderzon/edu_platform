import { z } from "zod";

/** Catalogue query. Every field is optional; defaults match the old handler. */
export const courseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().trim().optional(),
  level: z.string().trim().optional(),
  search: z.string().trim().optional(),
  price: z.enum(["free", "0-50", "50-100", "100+"]).optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "rating"]).default("newest"),
});

export type CourseQuery = z.infer<typeof courseQuerySchema>;
