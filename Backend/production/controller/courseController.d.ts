import { Request, Response } from "express";
import { AuthRequest } from "../middleware/middleware";
export declare const GetAllCourses: (req: Request, res: Response) => Promise<void>;
export declare const GetMyCourses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const GetCourseById: (req: Request, res: Response) => Promise<void>;
export declare const CreateCourse: (req: AuthRequest, res: Response) => Promise<void>;
export declare const UpdateCourse: (req: AuthRequest, res: Response) => Promise<void>;
export declare const PublishCourse: (req: AuthRequest, res: Response) => Promise<void>;
export declare const DeleteCourse: (req: AuthRequest, res: Response) => Promise<void>;
