import { z } from "zod";
/** Catalogue query. Every field is optional; defaults match the old handler. */
export declare const courseQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    category: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodEnum<{
        free: "free";
        "0-50": "0-50";
        "50-100": "50-100";
        "100+": "100+";
    }>>;
    sort: z.ZodDefault<z.ZodEnum<{
        newest: "newest";
        "price-asc": "price-asc";
        "price-desc": "price-desc";
        rating: "rating";
    }>>;
}, z.core.$strip>;
export type CourseQuery = z.infer<typeof courseQuerySchema>;
