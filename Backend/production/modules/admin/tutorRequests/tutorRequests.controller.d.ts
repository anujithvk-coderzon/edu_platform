import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const getPendingTutorRequestsCount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllTutorRequests: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const acceptTutorRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectTutorRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
