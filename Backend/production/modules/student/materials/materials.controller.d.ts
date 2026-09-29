import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const getMaterialById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const completeMaterial: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
