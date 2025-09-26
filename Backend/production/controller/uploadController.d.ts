import { Response } from "express";
import { AuthRequest } from "../middleware/middleware";
export declare const UploadSingleFile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const UploadMultipleFiles: (req: AuthRequest, res: Response) => Promise<void>;
export declare const UploadAvatar: (req: AuthRequest, res: Response) => Promise<void>;
export declare const UploadCourseThumbnail: (req: AuthRequest, res: Response) => Promise<void>;
export declare const UploadMaterial: (req: AuthRequest, res: Response) => Promise<void>;
export declare const DeleteUploadedFile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const GetFileInfo: (req: AuthRequest, res: Response) => Promise<void>;
