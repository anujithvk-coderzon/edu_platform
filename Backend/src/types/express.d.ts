import { AuthRequest } from '../middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        type: 'admin' | 'student';
        role?: string; // Admin role: "Admin" or "Tutor"
        firstName: string;
        lastName: string;
      };
    }

    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}