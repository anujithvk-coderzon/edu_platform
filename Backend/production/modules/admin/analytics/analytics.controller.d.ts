import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const getTutorAnalytics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCourseCompletion: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
