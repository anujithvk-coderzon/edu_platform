import { Request, Response } from "express";
import { AuthRequest } from "../middleware/middleware";
export declare const GetAllCategories: (req: Request, res: Response) => Promise<void>;
export declare const GetCategoryById: (req: Request, res: Response) => Promise<void>;
export declare const CreateCategory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const UpdateCategory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const DeleteCategory: (req: AuthRequest, res: Response) => Promise<void>;
