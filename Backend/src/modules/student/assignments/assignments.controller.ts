import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { BadRequestError, UnauthorizedError } from "../../../errors/Errors";
import {
  getSubmissionService,
  listCourseAssignmentsService,
  submitAssignmentService,
  uploadAssignmentFileService,
} from "./assignments.service";
import { submitAssignmentSchema } from "./assignments.validation";

const studentId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

export const listCourseAssignments = async (req: AuthRequest, res: Response) => {
  const data = await listCourseAssignmentsService(
    studentId(req),
    req.params.courseId as string,
  );
  return res.json({ success: true, data });
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  const parsed = submitAssignmentSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await submitAssignmentService(
    studentId(req),
    req.params.assignmentId as string,
    parsed.data,
  );
  return res.status(201).json({ success: true, data });
};

export const getSubmission = async (req: AuthRequest, res: Response) => {
  const data = await getSubmissionService(
    studentId(req),
    req.params.assignmentId as string,
  );
  return res.json({ success: true, data });
};

export const uploadAssignmentFile = async (req: AuthRequest, res: Response) => {
  studentId(req); // authorisation only; the file is not tied to a course yet
  if (!req.file) {
    throw new BadRequestError("No assignment file uploaded");
  }

  const data = await uploadAssignmentFileService(req.file);
  return res.json({ success: true, data });
};
