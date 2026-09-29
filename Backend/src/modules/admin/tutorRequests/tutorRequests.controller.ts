import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import {
  acceptTutorRequestService,
  getAllTutorRequestsService,
  getPendingTutorRequestsCountService,
  rejectTutorRequestService,
} from "./tutorRequests.service";
import {
  requestIdParamSchema,
  tutorRequestQuerySchema,
} from "./tutorRequests.validation";

/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
const adminId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

export const getPendingTutorRequestsCount = async (
  req: AuthRequest,
  res: Response,
) => {
  adminId(req);

  const data = await getPendingTutorRequestsCountService(req.user?.role);
  return res.json({ success: true, data });
};

export const getAllTutorRequests = async (req: AuthRequest, res: Response) => {
  adminId(req);

  const parsed = tutorRequestQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const data = await getAllTutorRequestsService(req.user?.role, parsed.data);
  return res.json({ success: true, data });
};

export const acceptTutorRequest = async (req: AuthRequest, res: Response) => {
  adminId(req);

  const parsed = requestIdParamSchema.safeParse(req.params);
  if (!parsed.success) throw parsed.error;

  const data = await acceptTutorRequestService(
    req.user?.role,
    parsed.data.requestId,
  );
  return res.json({
    success: true,
    data,
    message: "Tutor request accepted successfully. Welcome email has been sent.",
  });
};

export const rejectTutorRequest = async (req: AuthRequest, res: Response) => {
  adminId(req);

  const parsed = requestIdParamSchema.safeParse(req.params);
  if (!parsed.success) throw parsed.error;

  await rejectTutorRequestService(req.user?.role, parsed.data.requestId);
  return res.json({
    success: true,
    message: "Tutor request rejected successfully. Rejection email has been sent.",
  });
};
