import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import {
  cleanupOrphanedCoursesService,
  createCourseService,
  deleteCourseService,
  getCourseByIdService,
  getPendingCoursesCountService,
  listAllCoursesService,
  listMyCoursesService,
  listPendingCoursesService,
  listTutorsService,
  publishCourseService,
  rejectCourseService,
  submitCourseForReviewService,
  toggleTutorStatusService,
  updateCourseService,
} from "./courses.service";
import {
  allCoursesQuerySchema,
  createCourseSchema,
  myCoursesQuerySchema,
  rejectCourseSchema,
  toggleTutorStatusSchema,
  tutorsQuerySchema,
  updateCourseSchema,
} from "./courses.validation";

/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 *
 * `req.user.role` is the admin role ("Admin" or "Tutor") and every service
 * branches on it, so it is always passed through untouched.
 */
const callerId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

export const GetAllCourses = async (req: AuthRequest, res: Response) => {
  const parsed = allCoursesQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const data = await listAllCoursesService(parsed.data);
  return res.json({ success: true, data });
};

export const GetMyCourses = async (req: AuthRequest, res: Response) => {
  const parsed = myCoursesQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const data = await listMyCoursesService(
    parsed.data,
    callerId(req),
    req.user?.role,
  );
  return res.json({ success: true, data });
};

export const GetAllTutors = async (req: AuthRequest, res: Response) => {
  const parsed = tutorsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  callerId(req);
  const data = await listTutorsService(
    parsed.data,
    req.user?.type,
    req.user?.role,
  );
  return res.json({ success: true, data });
};

export const ToggleTutorStatus = async (req: AuthRequest, res: Response) => {
  const parsed = toggleTutorStatusSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  callerId(req);
  const { tutor, message } = await toggleTutorStatusService(
    req.params.id as string,
    parsed.data,
    req.user?.type,
    req.user?.role,
  );
  return res.json({ success: true, data: { tutor }, message });
};

export const GetCourseById = async (req: AuthRequest, res: Response) => {
  const data = await getCourseByIdService(
    req.params.id as string,
    callerId(req),
    req.user?.role,
  );
  return res.json({ success: true, data });
};

export const CreateCourse = async (req: AuthRequest, res: Response) => {
  const parsed = createCourseSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await createCourseService(parsed.data, {
    id: callerId(req),
    firstName: req.user!.firstName,
    lastName: req.user!.lastName,
  });
  return res.status(201).json({ success: true, data });
};

export const UpdateCourse = async (req: AuthRequest, res: Response) => {
  const parsed = updateCourseSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await updateCourseService(
    req.params.id as string,
    parsed.data,
    callerId(req),
    req.user?.role,
  );
  return res.json({ success: true, data });
};

export const SubmitCourseForReview = async (
  req: AuthRequest,
  res: Response,
) => {
  // The original nested `message` inside `data` on this route — kept as-is.
  const data = await submitCourseForReviewService(
    req.params.id as string,
    callerId(req),
  );
  return res.json({ success: true, data });
};

export const PublishCourse = async (req: AuthRequest, res: Response) => {
  callerId(req);
  const data = await publishCourseService(
    req.params.id as string,
    req.user?.role,
  );
  return res.json({ success: true, data });
};

export const RejectCourse = async (req: AuthRequest, res: Response) => {
  const parsed = rejectCourseSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw parsed.error;

  callerId(req);
  const data = await rejectCourseService(
    req.params.id as string,
    parsed.data,
    req.user?.role,
  );
  return res.json({ success: true, data });
};

export const GetPendingCoursesCount = async (
  req: AuthRequest,
  res: Response,
) => {
  callerId(req);
  const data = await getPendingCoursesCountService(req.user?.role);
  return res.json({ success: true, data });
};

export const GetPendingCourses = async (req: AuthRequest, res: Response) => {
  callerId(req);
  const data = await listPendingCoursesService(req.user?.role);
  return res.json({ success: true, data });
};

export const DeleteCourse = async (req: AuthRequest, res: Response) => {
  const summary = await deleteCourseService(
    req.params.id as string,
    callerId(req),
    req.user?.role,
  );
  // The original response carried `summary` at the top level, not under
  // `data` — kept as-is.
  return res.json({
    success: true,
    message: "Course and all associated files deleted successfully",
    summary,
  });
};

export const CleanupOrphanedCourses = async (
  req: AuthRequest,
  res: Response,
) => {
  callerId(req);
  const { data, message } = await cleanupOrphanedCoursesService();
  return res.json({ success: true, data, message });
};
