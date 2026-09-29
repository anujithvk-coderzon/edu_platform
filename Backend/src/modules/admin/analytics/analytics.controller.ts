import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import {
  getCourseCompletionService,
  getTutorAnalyticsService,
} from "./analytics.service";

/** authMiddleware guarantees req.user on every route in this module. */
const callerId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

export const getTutorAnalytics = async (req: AuthRequest, res: Response) => {
  const data = await getTutorAnalyticsService(callerId(req), req.user?.role);
  return res.json({ success: true, data });
};

export const getCourseCompletion = async (req: AuthRequest, res: Response) => {
  const data = await getCourseCompletionService(
    callerId(req),
    req.params.courseId as string,
  );
  return res.json({ success: true, data });
};
