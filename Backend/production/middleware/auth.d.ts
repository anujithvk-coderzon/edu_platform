import { Request, Response, NextFunction } from 'express';
type AdminRole = "Admin" | "Tutor";
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        type: 'admin' | 'student';
        role?: AdminRole;
        firstName: string;
        lastName: string;
    };
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const roleCheck: (allowedTypes: ("admin" | "student")[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const adminOnly: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export {};
