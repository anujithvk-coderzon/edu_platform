import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { BadRequestError, UnauthorizedError } from "../../../errors/Errors";
import * as uploadsService from "./uploads.service";
import { courseIdBodySchema } from "./uploads.validation";
import type { CourseIdBodyInput } from "./uploads.validation";

/**
 * HTTP only: check the multipart payload, call a service, shape the response.
 * No Prisma, no try/catch — Express 5 forwards throws to errorHandler.
 */
const parse = <T>(schema: { safeParse: (v: unknown) => any }, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw result.error;
  return result.data as T;
};

/** The staff member behind the request; role decides Admin vs Tutor reach. */
const caller = (req: AuthRequest): uploadsService.Caller => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return { id: req.user.id, role: req.user.role };
};

export const uploadSingleFile = async (req: AuthRequest, res: Response) => {
  caller(req); // authenticated staff only
  if (!req.file) {
    throw new BadRequestError("No file uploaded");
  }

  const data = await uploadsService.uploadSingleFileService(req.file);
  return res.json({ success: true, data });
};

export const uploadMultipleFiles = async (req: AuthRequest, res: Response) => {
  caller(req); // authenticated staff only
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new BadRequestError("No files uploaded");
  }

  const data = await uploadsService.uploadMultipleFilesService(req.files);
  return res.json({ success: true, data });
};

export const uploadCourseThumbnail = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new BadRequestError("No thumbnail file uploaded");
  }
  const { courseId } = parse<CourseIdBodyInput>(courseIdBodySchema, req.body);

  const data = await uploadsService.uploadCourseThumbnailService(
    caller(req),
    req.file,
    courseId,
  );
  return res.json({ success: true, data });
};

export const uploadMaterial = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new BadRequestError("No material file uploaded");
  }
  const { courseId } = parse<CourseIdBodyInput>(courseIdBodySchema, req.body);

  const data = await uploadsService.uploadMaterialService(caller(req), req.file, courseId);
  return res.json({ success: true, data });
};

export const deleteUploadedFile = async (req: AuthRequest, res: Response) => {
  caller(req); // authenticated staff only
  const { filename } = req.params;

  await uploadsService.deleteUploadedFileService(filename);
  // No `data` block here — the original replied with a bare message.
  return res.json({
    success: true,
    message: "File deleted successfully",
  });
};

export const getFileInfo = async (req: AuthRequest, res: Response) => {
  caller(req); // authenticated staff only
  const { filename } = req.params;

  const data = await uploadsService.getFileInfoService(filename);
  return res.json({ success: true, data });
};

export const uploadAdminAvatar = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new BadRequestError("No avatar file uploaded");
  }

  const data = await uploadsService.uploadAdminAvatarService(caller(req).id, req.file);
  return res.json({
    success: true,
    data,
    message: "Avatar uploaded successfully",
  });
};
