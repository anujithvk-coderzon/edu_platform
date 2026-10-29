import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth";
export declare const createOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
