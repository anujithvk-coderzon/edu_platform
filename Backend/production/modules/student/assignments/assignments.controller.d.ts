import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const listCourseAssignments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const submitAssignment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSubmission: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadAssignmentFile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
