import { Request, Response } from "express";
import { AuthRequest } from "../middleware/middleware";
export declare const GetCourseModules: (req: Request, res: Response) => Promise<void>;
export declare const GetModuleById: (req: Request, res: Response) => Promise<void>;
export declare const CreateModule: (req: AuthRequest, res: Response) => Promise<void>;
export declare const UpdateModule: (req: AuthRequest, res: Response) => Promise<void>;
export declare const DeleteModule: (req: AuthRequest, res: Response) => Promise<void>;
export declare const ReorderModule: (req: AuthRequest, res: Response) => Promise<void>;
