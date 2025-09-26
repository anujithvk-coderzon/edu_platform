import { Response } from "express";
import { AuthRequest } from "../middleware/middleware";
export declare const GetAllUsers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const GetUserById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const UpdateUser: (req: AuthRequest, res: Response) => Promise<void>;
export declare const DeleteUser: (req: AuthRequest, res: Response) => Promise<void>;
export declare const GetUserStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const GetAllTutors: (req: AuthRequest, res: Response) => Promise<void>;
