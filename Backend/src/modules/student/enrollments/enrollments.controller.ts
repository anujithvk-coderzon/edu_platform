import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import {
  enrollInCourseService,
  getEnrollmentProgressService,
  listMyEnrollmentsService,
} from "./enrollments.service";
import {
  enrollmentQuerySchema,
  enrollSchema,
} from "./enrollments.validation";

/** authMiddleware guarantees req.user on every route in this module. */
const studentId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

export const listMyEnrollments = async (req: AuthRequest, res: Response) => {
  const parsed = enrollmentQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const data = await listMyEnrollmentsService(studentId(req), parsed.data);
  return res.json({ success: true, data });
};

export const enrollInCourse = async (req: AuthRequest, res: Response) => {
  const parsed = enrollSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await enrollInCourseService(studentId(req), parsed.data.courseId);
  return res.status(201).json({
    success: true,
    data,
    message: "Successfully enrolled in course",
  });
};

export const getEnrollmentProgress = async (req: AuthRequest, res: Response) => {
  const data = await getEnrollmentProgressService(
    studentId(req),
    req.params.courseId as string,
  );
  return res.json({ success: true, data });
};
