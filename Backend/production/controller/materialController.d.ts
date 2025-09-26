import { Request, Response } from "express";
import { AuthRequest } from "../middleware/middleware";
export declare const GetCourseMaterials: (req: Request, res: Response) => Promise<void>;
export declare const GetMaterialById: (req: Request, res: Response) => Promise<void>;
export declare const CreateMaterial: (req: AuthRequest, res: Response) => Promise<void>;
export declare const UpdateMaterial: (req: AuthRequest, res: Response) => Promise<void>;
export declare const DeleteMaterial: (req: AuthRequest, res: Response) => Promise<void>;
export declare const CompleteMaterial: (req: AuthRequest, res: Response) => Promise<void>;
