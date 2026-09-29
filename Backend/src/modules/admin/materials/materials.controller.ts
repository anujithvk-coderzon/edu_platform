import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import * as materialsService from "./materials.service";
import {
  courseIdParamSchema,
  createMaterialSchema,
  materialIdParamSchema,
  updateMaterialSchema,
} from "./materials.validation";
import type { CreateMaterialInput, UpdateMaterialInput } from "./materials.validation";

/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
const parse = <T>(schema: { safeParse: (v: unknown) => any }, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw result.error;
  return result.data as T;
};

/** The staff member behind the request; role decides Admin vs Tutor reach. */
const caller = (req: AuthRequest): materialsService.Caller => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return { id: req.user.id, role: req.user.role };
};

export const getCourseMaterials = async (req: AuthRequest, res: Response) => {
  caller(req); // authenticated staff only
  const { courseId } = parse<{ courseId: string }>(courseIdParamSchema, req.params);

  const data = await materialsService.getCourseMaterialsService(courseId);
  return res.json({ success: true, data });
};

export const getMaterialById = async (req: AuthRequest, res: Response) => {
  const { id } = parse<{ id: string }>(materialIdParamSchema, req.params);

  const data = await materialsService.getMaterialByIdService(caller(req).id, id);
  return res.json({ success: true, data });
};

export const createMaterial = async (req: AuthRequest, res: Response) => {
  const input = parse<CreateMaterialInput>(createMaterialSchema, req.body);

  const data = await materialsService.createMaterialService(caller(req), input);
  return res.status(201).json({ success: true, data });
};

export const updateMaterial = async (req: AuthRequest, res: Response) => {
  const { id } = parse<{ id: string }>(materialIdParamSchema, req.params);
  const input = parse<UpdateMaterialInput>(updateMaterialSchema, req.body);

  const data = await materialsService.updateMaterialService(caller(req), id, input);
  return res.json({ success: true, data });
};

export const deleteMaterial = async (req: AuthRequest, res: Response) => {
  const { id } = parse<{ id: string }>(materialIdParamSchema, req.params);

  await materialsService.deleteMaterialService(caller(req), id);
  // No `data` block here — the original replied with a bare message.
  return res.json({
    success: true,
    message: "Material and associated file deleted successfully",
  });
};

export const completeMaterial = async (req: AuthRequest, res: Response) => {
  const { id } = parse<{ id: string }>(materialIdParamSchema, req.params);

  const data = await materialsService.completeMaterialService(caller(req).id, id);
  return res.json({ success: true, data });
};
