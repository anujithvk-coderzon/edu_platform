import type { Request, Response } from "express";
import { getStudentToken } from "../../../lib/authToken";
import { verifyStudentToken } from "../../../lib/jwt";
import {
  getCourseByIdService,
  listCategoriesService,
  listCoursesService,
} from "./courses.service";
import { courseQuerySchema } from "./courses.validation";

/**
 * These endpoints are public but personalise the response when a valid token is
 * present (enrollment status, progress, whether the student has reviewed).
 * An absent or invalid token is not an error — it just means no personalisation.
 */
const optionalStudentId = (req: Request): string | null => {
  const token = getStudentToken(req);
  if (!token) return null;
  return verifyStudentToken(token)?.id ?? null;
};

export const listCourses = async (req: Request, res: Response) => {
  const parsed = courseQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const data = await listCoursesService(parsed.data, optionalStudentId(req));
  return res.json({ success: true, data });
};

export const listCategories = async (_req: Request, res: Response) => {
  const data = await listCategoriesService();
  return res.json({ success: true, data });
};

export const getCourseById = async (req: Request, res: Response) => {
  const data = await getCourseByIdService(
    req.params.id as string,
    optionalStudentId(req),
  );
  return res.json({ success: true, data });
};
