import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const createAssignment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCourseAssignments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAssignmentById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateAssignment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteAssignment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAssignmentSubmissions: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const gradeSubmission: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
