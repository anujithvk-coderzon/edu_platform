import type { Request, Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import {
  getMyReviewService,
  listCourseReviewsService,
  submitReviewService,
} from "./reviews.service";
import { reviewQuerySchema, submitReviewSchema } from "./reviews.validation";

const studentId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

export const submitReview = async (req: AuthRequest, res: Response) => {
  const parsed = submitReviewSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await submitReviewService(studentId(req), parsed.data);
  return res.json({
    success: true,
    data,
    message: "Review submitted successfully",
  });
};

/** Public: anyone can read a course's reviews. */
export const listCourseReviews = async (req: Request, res: Response) => {
  const parsed = reviewQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const data = await listCourseReviewsService(
    req.params.courseId as string,
    parsed.data,
  );
  return res.json({ success: true, data });
};

export const getMyReview = async (req: AuthRequest, res: Response) => {
  const data = await getMyReviewService(
    studentId(req),
    req.params.courseId as string,
  );
  return res.json({ success: true, data });
};
