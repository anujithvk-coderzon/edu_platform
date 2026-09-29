import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const listMyEnrollments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const enrollInCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getEnrollmentProgress: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
