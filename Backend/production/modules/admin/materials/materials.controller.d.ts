import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const getCourseMaterials: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMaterialById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createMaterial: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMaterial: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteMaterial: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const completeMaterial: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
