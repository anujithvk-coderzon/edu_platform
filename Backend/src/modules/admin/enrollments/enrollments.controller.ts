import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import {
  deleteEnrollmentService,
  enrollInCourseService,
  getCourseStudentsService,
  getEnrollmentProgressService,
  getMyEnrollmentsService,
  updateEnrollmentStatusService,
} from "./enrollments.service";
import {
  courseIdParamSchema,
  enrollmentIdParamSchema,
  enrollSchema,
  updateEnrollmentStatusSchema,
} from "./enrollments.validation";

/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
const parse = <T>(
  schema: { safeParse: (v: unknown) => any },
  value: unknown,
): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw result.error;
  return result.data as T;
};

/** authMiddleware guarantees req.user on every route in this module. */
const callerId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

/** "Admin" bypasses course-ownership checks; "Tutor" does not. */
const callerRole = (req: AuthRequest) => req.user?.role;

export const enrollInCourse = async (req: AuthRequest, res: Response) => {
  const { courseId } = parse<{ courseId: string }>(enrollSchema, req.body);

  const data = await enrollInCourseService(callerId(req), courseId);
  return res.status(201).json({ success: true, data });
};

export const getMyEnrollments = async (req: AuthRequest, res: Response) => {
  const data = await getMyEnrollmentsService(callerId(req));
  return res.json({ success: true, data });
};

export const getCourseStudents = async (req: AuthRequest, res: Response) => {
  const { courseId } = parse<{ courseId: string }>(
    courseIdParamSchema,
    req.params,
  );

  const data = await getCourseStudentsService(
    callerId(req),
    callerRole(req),
    courseId,
  );
  return res.json({ success: true, data });
};

export const updateEnrollmentStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  const { enrollmentId } = parse<{ enrollmentId: string }>(
    enrollmentIdParamSchema,
    req.params,
  );
  const { status } = parse<{ status: "ACTIVE" | "COMPLETED" | "DROPPED" }>(
    updateEnrollmentStatusSchema,
    req.body,
  );

  const data = await updateEnrollmentStatusService(
    callerId(req),
    callerRole(req),
    enrollmentId,
    status,
  );
  return res.json({ success: true, data });
};

export const getEnrollmentProgress = async (req: AuthRequest, res: Response) => {
  const { courseId } = parse<{ courseId: string }>(
    courseIdParamSchema,
    req.params,
  );

  const data = await getEnrollmentProgressService(callerId(req), courseId);
  return res.json({ success: true, data });
};

export const deleteEnrollment = async (req: AuthRequest, res: Response) => {
  const { enrollmentId } = parse<{ enrollmentId: string }>(
    enrollmentIdParamSchema,
    req.params,
  );

  await deleteEnrollmentService(callerId(req), callerRole(req), enrollmentId);
  return res.json({
    success: true,
    message: "Enrollment cancelled successfully",
  });
};
