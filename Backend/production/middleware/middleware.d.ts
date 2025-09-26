import { NextFunction, Request, Response } from "express";
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        type: 'admin' | 'student';
        role?: string;
        firstName: string;
        lastName: string;
    };
}
export declare const IsAuthenticated: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const IsAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const IsTutor: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const IsHybridAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
