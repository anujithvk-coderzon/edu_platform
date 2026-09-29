import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const uploadSingleFile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadMultipleFiles: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadCourseThumbnail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadMaterial: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteUploadedFile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFileInfo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadAdminAvatar: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
