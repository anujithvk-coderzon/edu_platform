import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import {
  createModuleService,
  deleteModuleService,
  getCourseModulesService,
  getModuleByIdService,
  reorderModuleService,
  updateModuleService,
} from "./modules.service";
import {
  createModuleSchema,
  reorderModuleSchema,
  updateModuleSchema,
} from "./modules.validation";

/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
const callerId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

export const GetCourseModules = async (req: AuthRequest, res: Response) => {
  const data = await getCourseModulesService(
    req.params.courseId as string,
    callerId(req),
    req.user?.role,
  );
  return res.json({ success: true, data });
};

export const GetModuleById = async (req: AuthRequest, res: Response) => {
  const data = await getModuleByIdService(
    req.params.id as string,
    callerId(req),
    req.user?.role,
  );
  return res.json({ success: true, data });
};

export const CreateModule = async (req: AuthRequest, res: Response) => {
  const parsed = createModuleSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await createModuleService(
    parsed.data,
    callerId(req),
    req.user?.role,
  );
  return res.status(201).json({ success: true, data });
};

export const UpdateModule = async (req: AuthRequest, res: Response) => {
  const parsed = updateModuleSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await updateModuleService(
    req.params.id as string,
    parsed.data,
    callerId(req),
    req.user?.role,
  );
  return res.json({ success: true, data });
};

export const DeleteModule = async (req: AuthRequest, res: Response) => {
  await deleteModuleService(
    req.params.id as string,
    callerId(req),
    req.user?.role,
  );
  // The original response carried no `data` key — kept as-is.
  return res.json({
    success: true,
    message: "Module deleted successfully",
  });
};

export const ReorderModule = async (req: AuthRequest, res: Response) => {
  const parsed = reorderModuleSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await reorderModuleService(
    req.params.id as string,
    parsed.data,
    callerId(req),
    req.user?.role,
  );
  return res.json({ success: true, data });
};
