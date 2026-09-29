import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import {
  completeMaterialService,
  getMaterialByIdService,
} from "./materials.service";

const studentId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

export const getMaterialById = async (req: AuthRequest, res: Response) => {
  const data = await getMaterialByIdService(
    studentId(req),
    req.params.id as string,
  );
  return res.json({ success: true, data });
};

export const completeMaterial = async (req: AuthRequest, res: Response) => {
  const data = await completeMaterialService(
    studentId(req),
    req.params.id as string,
  );
  return res.json({ success: true, data });
};
