import type { Request, Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
/** Public: the category list feeds the course catalogue filters. */
export declare const getAllCategories: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/** Public: a single category with its courses. */
export declare const getCategoryById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
