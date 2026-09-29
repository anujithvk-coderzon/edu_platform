import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import * as assignmentsService from "./assignments.service";
import {
  assignmentIdParamSchema,
  assignmentIdRouteParamSchema,
  courseIdParamSchema,
  createAssignmentSchema,
  gradeSubmissionSchema,
  submissionIdParamSchema,
  updateAssignmentSchema,
} from "./assignments.validation";
import type {
  CreateAssignmentInput,
  GradeSubmissionInput,
  UpdateAssignmentInput,
} from "./assignments.validation";

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
const caller = (req: AuthRequest): assignmentsService.Caller => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return { id: req.user.id, role: req.user.role };
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  const input = parse<CreateAssignmentInput>(createAssignmentSchema, req.body);

  const data = await assignmentsService.createAssignmentService(caller(req), input);
  return res.status(201).json({ success: true, data });
};

export const getCourseAssignments = async (req: AuthRequest, res: Response) => {
  const { courseId } = parse<{ courseId: string }>(courseIdParamSchema, req.params);

  const data = await assignmentsService.getCourseAssignmentsService(
    caller(req),
    courseId,
  );
  return res.json({ success: true, data });
};

export const getAssignmentById = async (req: AuthRequest, res: Response) => {
  const { id } = parse<{ id: string }>(assignmentIdParamSchema, req.params);

  const data = await assignmentsService.getAssignmentByIdService(caller(req), id);
  return res.json({ success: true, data });
};

export const updateAssignment = async (req: AuthRequest, res: Response) => {
  const { id } = parse<{ id: string }>(assignmentIdParamSchema, req.params);
  const input = parse<UpdateAssignmentInput>(updateAssignmentSchema, req.body);

  const data = await assignmentsService.updateAssignmentService(
    caller(req),
    id,
    input,
  );
  return res.json({ success: true, data });
};

export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  const { id } = parse<{ id: string }>(assignmentIdParamSchema, req.params);

  const data = await assignmentsService.deleteAssignmentService(caller(req), id);
  // `message` sits alongside `data` here — the original replied with both.
  return res.json({
    success: true,
    message: "Assignment deleted successfully",
    data,
  });
};

export const getAssignmentSubmissions = async (req: AuthRequest, res: Response) => {
  const { assignmentId } = parse<{ assignmentId: string }>(
    assignmentIdRouteParamSchema,
    req.params,
  );

  const data = await assignmentsService.getAssignmentSubmissionsService(
    caller(req),
    assignmentId,
  );
  return res.json({ success: true, data });
};

export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  const { submissionId } = parse<{ submissionId: string }>(
    submissionIdParamSchema,
    req.params,
  );
  const input = parse<GradeSubmissionInput>(gradeSubmissionSchema, req.body);

  const data = await assignmentsService.gradeSubmissionService(
    caller(req),
    submissionId,
    input,
  );
  return res.json({ success: true, data });
};
