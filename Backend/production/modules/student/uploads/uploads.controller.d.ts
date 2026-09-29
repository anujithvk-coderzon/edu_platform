import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
export declare const uploadAvatar: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
