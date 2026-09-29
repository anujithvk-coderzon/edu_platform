import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const GetCourseModules: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const GetModuleById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const CreateModule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const UpdateModule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const DeleteModule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const ReorderModule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
