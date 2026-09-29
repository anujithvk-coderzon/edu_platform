"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseQuerySchema = void 0;
const zod_1 = require("zod");
/** Catalogue query. Every field is optional; defaults match the old handler. */
exports.courseQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(12),
    category: zod_1.z.string().trim().optional(),
    level: zod_1.z.string().trim().optional(),
    search: zod_1.z.string().trim().optional(),
    price: zod_1.z.enum(["free", "0-50", "50-100", "100+"]).optional(),
    sort: zod_1.z.enum(["newest", "price-asc", "price-desc", "rating"]).default("newest"),
});
