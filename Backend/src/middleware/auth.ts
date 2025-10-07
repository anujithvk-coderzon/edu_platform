import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../DB/DB_Config';

// Define admin role type to match what's used in the database
type AdminRole = "Admin" | "Tutor";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    type: 'admin' | 'student';
    role?: AdminRole; // Admin role: "Admin" or "Tutor"
    firstName: string;
    lastName: string;
    sessionToken?: string; // Session token for validation
  };
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for role-specific cookies first, then fallback to Authorization header
    const adminToken = req.cookies.admin_token;
    const studentToken = req.cookies.student_token;
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');

    const token = adminToken || studentToken || headerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' }
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    } catch (jwtError: any) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token.' }
      });
    }

    let user: any = null;
    let userType: 'admin' | 'student';

    // Determine user type from token or cookie
    if (decoded.type) {
      userType = decoded.type;
    } else if (adminToken) {
      userType = 'admin';
    } else if (studentToken) {
      userType = 'student';
    } else {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type.' }
      });
    }

    // Fetch user from appropriate table
    if (userType === 'admin') {
      user = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isVerified: true
        }
      });
    } else {
      user = await prisma.student.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isVerified: true,
          activeSessionToken: true
        }
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token.' }
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is deactivated.' }
      });
    }

    // For students: Validate session token to prevent concurrent logins
    if (userType === 'student' && decoded.sessionToken) {
      if (!user.activeSessionToken || user.activeSessionToken !== decoded.sessionToken) {
        return res.status(401).json({
          success: false,
          error: { message: 'Session expired. You have been logged in from another device.' }
        });
      }
    }

    // Validate that the token cookie matches the user type
    // Allow if the correct cookie exists for the determined user type
    if ((userType === 'admin' && !adminToken) || (userType === 'student' && !studentToken)) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token for user type.' }
      });
    }

    req.user = {
      ...user,
      type: userType,
      role: userType === 'admin' ? (user.role as AdminRole) : undefined
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

export const roleCheck = (allowedTypes: ('admin' | 'student')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required.' }
      });
    }

    if (!allowedTypes.includes(req.user.type)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions.' }
      });
    }

    next();
  };
};

export const adminOnly = roleCheck(['admin']);