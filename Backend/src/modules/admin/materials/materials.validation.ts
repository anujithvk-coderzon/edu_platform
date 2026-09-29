import { z } from "zod";

/**
 * Course materials (Prisma model `material`, enum `MaterialType`).
 *
 * These schemas replace the inline express-validator chains the admin routes
 * used to carry, so the limits below mirror them one for one: title 1-200,
 * order indexes are non-negative integers, type is PDF | VIDEO | LINK.
 */

const title = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be at most 200 characters");

const description = z.string().trim();

const materialType = z.enum(["PDF", "VIDEO", "LINK"], {
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
const FILE_URL_PATTERN =
  /^(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\/][^\s]*|images\/.+|avatars\/.+|materials\/.+|uploads\/.+|videos\/.+|audios\/.+|documents\/.+|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;

const fileUrl = z
  .string()
  .refine(
    (value) => value.trim() === "" || FILE_URL_PATTERN.test(value),
    "Invalid URL or path format",
  );

const orderIndex = z.coerce
  .number({ error: "Order index is required" })
  .int("Order index must be a whole number")
  .min(0, "Order index must be 0 or greater");

const moduleId = z.string().min(1, "Module ID is required");

/**
 * Clients post either a real boolean or the string form a HTML form produces.
 * On update the service still only applies real booleans, which is what the
 * original handler did (`typeof isPublic === 'boolean'`).
 */
const isPublicValue = z.union([z.boolean(), z.literal("true"), z.literal("false")]);

export const createMaterialSchema = z.object({
  title,
  description: description.nullable().optional(),
  type: materialType,
  fileUrl: fileUrl.nullable().optional(),
  content: z.string().nullable().optional(),
  orderIndex,
  courseId: z
    .string({ error: "Course ID is required" })
    .min(1, "Course ID is required"),
  moduleId: moduleId.nullable().optional(),
  isPublic: isPublicValue.default(false).transform((v) => v === true || v === "true"),
});

/**
 * Every field is optional on update; the service decides which keys actually
 * reach Prisma, exactly as the original handler did.
 */
export const updateMaterialSchema = z.object({
  title: title.optional(),
  description: description.nullable().optional(),
  type: materialType.optional(),
  fileUrl: fileUrl.nullable().optional(),
  content: z.string().nullable().optional(),
  orderIndex: orderIndex.optional(),
  moduleId: moduleId.nullable().optional(),
  isPublic: isPublicValue.optional(),
});

export const materialIdParamSchema = z.object({
  id: z
    .string({ error: "Material ID is required" })
    .min(1, "Material ID is required"),
});

export const courseIdParamSchema = z.object({
  courseId: z
    .string({ error: "Course ID is required" })
    .min(1, "Course ID is required"),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type MaterialIdParam = z.infer<typeof materialIdParamSchema>;
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
