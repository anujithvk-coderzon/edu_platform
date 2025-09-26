import { Response } from "express";
import { AuthRequest } from "../middleware/middleware";
export declare const GetTutorAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const GetCourseCompletion: (req: AuthRequest, res: Response) => Promise<void>;
