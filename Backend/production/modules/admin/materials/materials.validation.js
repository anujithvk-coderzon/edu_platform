"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseIdParamSchema = exports.materialIdParamSchema = exports.updateMaterialSchema = exports.createMaterialSchema = void 0;
const zod_1 = require("zod");
/**
 * Course materials (Prisma model `material`, enum `MaterialType`).
 *
 * These schemas replace the inline express-validator chains the admin routes
 * used to carry, so the limits below mirror them one for one: title 1-200,
 * order indexes are non-negative integers, type is PDF | VIDEO | LINK.
 */
const title = zod_1.z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters");
const description = zod_1.z.string().trim();
const materialType = zod_1.z.enum(["PDF", "VIDEO", "LINK"], {
    error: "Type must be one of PDF, VIDEO or LINK",
});
/**
 * `fileUrl` is deliberately polymorphic and must stay that way:
 *
 *  - a relative CDN path written by the upload endpoints
 *    (`materials/...`, `uploads/...`, `videos/...`, `images/...`, ...),
 *  - a bare Bunny Stream video GUID (uuid, no scheme, no slashes),
 *  - or a fully external URL (`https://...`, `www....`).
 *
 * The delete paths depend on the bare forms — `Delete_File` wants a relative
 * path and `deleteVideoFromBunnyStream` wants a bare GUID — so this must not
 * be narrowed to "a URL". An empty string is left alone, exactly as the old
 * custom validator did (it only ran its regex on non-blank values).
 */
const FILE_URL_PATTERN = /^(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\/][^\s]*|images\/.+|avatars\/.+|materials\/.+|uploads\/.+|videos\/.+|audios\/.+|documents\/.+|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
const fileUrl = zod_1.z
    .string()
    .refine((value) => value.trim() === "" || FILE_URL_PATTERN.test(value), "Invalid URL or path format");
const orderIndex = zod_1.z.coerce
    .number({ error: "Order index is required" })
    .int("Order index must be a whole number")
    .min(0, "Order index must be 0 or greater");
const moduleId = zod_1.z.string().min(1, "Module ID is required");
/**
 * Clients post either a real boolean or the string form a HTML form produces.
 * On update the service still only applies real booleans, which is what the
 * original handler did (`typeof isPublic === 'boolean'`).
 */
const isPublicValue = zod_1.z.union([zod_1.z.boolean(), zod_1.z.literal("true"), zod_1.z.literal("false")]);
exports.createMaterialSchema = zod_1.z.object({
    title,
    description: description.nullable().optional(),
    type: materialType,
    fileUrl: fileUrl.nullable().optional(),
    content: zod_1.z.string().nullable().optional(),
    orderIndex,
    courseId: zod_1.z
        .string({ error: "Course ID is required" })
        .min(1, "Course ID is required"),
    moduleId: moduleId.nullable().optional(),
    isPublic: isPublicValue.default(false).transform((v) => v === true || v === "true"),
});
/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did.
 */
exports.updateMaterialSchema = zod_1.z.object({
    title: title.optional(),
    description: description.nullable().optional(),
    type: materialType.optional(),
    fileUrl: fileUrl.nullable().optional(),
    content: zod_1.z.string().nullable().optional(),
    orderIndex: orderIndex.optional(),
    moduleId: moduleId.nullable().optional(),
    isPublic: isPublicValue.optional(),
});
exports.materialIdParamSchema = zod_1.z.object({
    id: zod_1.z
        .string({ error: "Material ID is required" })
        .min(1, "Material ID is required"),
});
exports.courseIdParamSchema = zod_1.z.object({
    courseId: zod_1.z
        .string({ error: "Course ID is required" })
        .min(1, "Course ID is required"),
});
