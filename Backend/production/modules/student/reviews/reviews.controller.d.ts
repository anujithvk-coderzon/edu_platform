import type { Request, Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const submitReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/** Public: anyone can read a course's reviews. */
export declare const listCourseReviews: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
