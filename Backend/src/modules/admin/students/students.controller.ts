import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import {
  blockStudentService,
  deleteUserService,
  getAllStudentsService,
  getStudentStatsService,
  getStudentsCountService,
  getUserByIdService,
  getUserStatsService,
  listRegisteredStudentsService,
  unblockStudentService,
  updateUserService,
} from "./students.service";
import {
  allStudentsQuerySchema,
  registeredStudentsQuerySchema,
  studentIdParamSchema,
  updateUserSchema,
  userIdParamSchema,
} from "./students.validation";

/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */

/** authMiddleware guarantees req.user on every route in this module. */
const adminId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

export const getStudentsCount = async (_req: AuthRequest, res: Response) => {
  const data = await getStudentsCountService();
  return res.status(200).json({ success: true, data });
};

export const getAllRegisteredStudents = async (
  req: AuthRequest,
  res: Response,
) => {
  const parsed = registeredStudentsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const data = await listRegisteredStudentsService(parsed.data);
  return res.status(200).json({ success: true, data });
};

export const getUserStats = async (_req: AuthRequest, res: Response) => {
  const data = await getUserStatsService();
  return res.json({ success: true, data });
};

export const getStudentStats = async (_req: AuthRequest, res: Response) => {
  const data = await getStudentStatsService();
  return res.json({ success: true, data });
};

export const getAllStudents = async (req: AuthRequest, res: Response) => {
  // Validated for parity with the old route chain; the aggregation itself is
  // unpaginated, exactly as before.
  const parsed = allStudentsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const data = await getAllStudentsService(adminId(req), req.user?.role);
  return res.json({ success: true, data });
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  const parsed = userIdParamSchema.safeParse(req.params);
  if (!parsed.success) throw parsed.error;

  const data = await getUserByIdService(parsed.data.id);
  return res.json({ success: true, data });
};

export const blockStudent = async (req: AuthRequest, res: Response) => {
  const parsed = studentIdParamSchema.safeParse(req.params);
  if (!parsed.success) throw parsed.error;

  const { data, message } = await blockStudentService(
    parsed.data.studentId,
    adminId(req),
    req.user?.role,
  );
  return res.json({ success: true, data, message });
};

export const unblockStudent = async (req: AuthRequest, res: Response) => {
  const parsed = studentIdParamSchema.safeParse(req.params);
  if (!parsed.success) throw parsed.error;

  const { data, message } = await unblockStudentService(
    parsed.data.studentId,
    adminId(req),
    req.user?.role,
  );
  return res.json({ success: true, data, message });
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const params = userIdParamSchema.safeParse(req.params);
  if (!params.success) throw params.error;

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await updateUserService(params.data.id, parsed.data);
  return res.json({ success: true, data });
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const parsed = userIdParamSchema.safeParse(req.params);
  if (!parsed.success) throw parsed.error;

  await deleteUserService(parsed.data.id, adminId(req));
  // No `data` key here — the original response was `{ success, message }`.
  return res.json({ success: true, message: "User deleted successfully" });
};
