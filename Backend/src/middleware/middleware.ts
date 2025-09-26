import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../DB/DB_Config";

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

export const IsAuthenticated = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      res.status(401).json({ message: "Not Authorized" });
      return;
    }
    const token = header.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) {
        res.status(401).json({ message: "Not Authorized" });
        return;
      }
      (req as any).user = decoded;
      next();
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Unexpected Error Occurred", error: error.message });
  }
};

export const IsAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      res.status(401).json({ message: "Not Authorized" });
      return;
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Unexpected Error Occurred", error: error.message });
  }
};

export const IsTutor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      res.status(401).json({ message: "Not Authorized" });
      return;
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.role !== "tutor") {
      res.status(403).json({ message: "Tutor access required" });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Unexpected Error Occurred", error: error.message });
  }
};

export const IsHybridAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;
    let decoded: any;

    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!);

        let user: any = null;
        if (decoded.role === "admin") {
          user = await prisma.admin.findUnique({
            where: { id: decoded.id },
          });
        } else if (decoded.role === "tutor") {
          user = await prisma.admin.findUnique({
            where: { id: decoded.id },
          });
        } else if (decoded.role === "student") {
          user = await prisma.student.findUnique({
            where: { id: decoded.id },
          });
        }

        if (!user) {
          res.status(401).json({ message: "User not found" });
          return;
        }

        (req as any).user = user;
        (req as any).authMethod = "jwt";
        return next();
      } catch (err) {
        res.status(401).json({ message: "Invalid token" });
        return;
      }
    }

    token = req.cookies.auth_token;
    if (!token) {
      res.status(401).json({ message: "Not Authorized - No token provided" });
      return;
    }

    decoded = jwt.verify(token, process.env.JWT_SECRET!);
    let user: any = null;

    if (decoded.role === "admin") {
      user = await prisma.admin.findUnique({
        where: { id: decoded.id },
      });
    } else if (decoded.role === "tutor") {
      user = await prisma.admin.findUnique({
        where: { id: decoded.id },
      });
    } else if (decoded.role === "student") {
      user = await prisma.student.findUnique({
        where: { id: decoded.id },
      });
    }

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    (req as any).user = user;
    (req as any).authMethod = "cookie";
    next();
  } catch (error: any) {
    res
      .status(401)
      .json({ message: "Invalid or expired token", error: error.message });
  }
};