import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import prisma from "../DB/DB_Config";
import { AuthRequest } from "../middleware/middleware";
import {
  generateOTP,
  StoreForgetOtp,
  VerifyForgetOtp,
  ForgetPasswordMail,
  ClearForgetOtp,
} from "../utils/EmailVerification";

const GenerateToken = (userId: string) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
  );
};

export const BootstrapAdmin = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const adminExists = await prisma.admin.findFirst();
    if (adminExists) {
      res.status(400).json({
        success: false,
        error: { message: "Admin already exists. Use /register endpoint." },
      });
      return;
    }

    const { email, password, firstName, lastName } = req.body;
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      res.status(400).json({
        success: false,
        error: { message: "Admin already exists with this email" },
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "admin",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    const token = GenerateToken(user.id);
    const cookieName = "admin_token";

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const RegisterUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const { email, password, firstName, lastName, role } = req.body;

    if (role === "admin") {
      const existingAdmin = await prisma.admin.findUnique({
        where: { email },
      });

      if (existingAdmin) {
        res.status(400).json({
          success: false,
          error: { message: "Admin already exists with this email" },
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "admin",
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      const token = GenerateToken(user.id);
      const cookieName = "admin_token";

      res.cookie(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: { user, token },
      });
    } else if (role === "tutor") {
      const existingTutor = await prisma.admin.findUnique({
        where: { email },
      });

      if (existingTutor) {
        res.status(400).json({
          success: false,
          error: { message: "Tutor already exists with this email" },
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "tutor",
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      const token = GenerateToken(user.id);
      const cookieName = "tutor_token";

      res.cookie(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: { user, token },
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: "Invalid role specified" },
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const RegisterTutor = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        error: { message: "Only admins can register tutors" },
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const { email, password, firstName, lastName } = req.body;
    const existingTutor = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingTutor) {
      res.status(400).json({
        success: false,
        error: { message: "Tutor already exists with this email" },
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const tutor = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "tutor",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { tutor },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const LoginUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const { email, password, role } = req.body;

    let user: any = null;
    let cookieName: string;

    if (role === "admin") {
      user = await prisma.admin.findUnique({
        where: { email },
      });
      cookieName = "admin_token";
    } else if (role === "tutor") {
      user = await prisma.admin.findUnique({
        where: { email },
      });
      cookieName = "tutor_token";
    } else {
      res.status(400).json({
        success: false,
        error: { message: "Invalid role specified" },
      });
      return;
    }

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Invalid credentials" },
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: { message: "Invalid credentials" },
      });
      return;
    }

    const token = GenerateToken(user.id);
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      success: true,
      data: { user: userWithoutPassword, token },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const LogoutUser = (req: AuthRequest, res: Response) => {
  try {
    res.clearCookie("admin_token");
    res.clearCookie("tutor_token");
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const AdminForgotPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const { email } = req.body;
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        error: { message: "Admin not found with this email" },
      });
      return;
    }

    const otp = generateOTP();
    StoreForgetOtp(email, otp);
    await ForgetPasswordMail(email, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const AdminVerifyForgotPasswordOtp = async (
  req: Request,
  res: Response
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const { email, otp } = req.body;
    const isValid = VerifyForgetOtp(email, otp);

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: { message: "Invalid or expired OTP" },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const AdminResetPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const { email, newPassword } = req.body;
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        error: { message: "Admin not found" },
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({
      where: { email },
      data: { password: hashedPassword },
    });

    ClearForgetOtp(email);
    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const GetCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const UpdateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const updates = req.body;
    delete updates.password;
    delete updates.email;
    delete updates.role;

    let updatedUser: any;
    if (req.user.role === "admin") {
      updatedUser = await prisma.admin.update({
        where: { id: req.user.id },
        data: updates,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });
    } else if (req.user.role === "tutor") {
      updatedUser = await prisma.admin.update({
        where: { id: req.user.id },
        data: updates,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const ChangePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Fetch user with password to verify
    let user: any;
    if (req.user.role === "admin" || req.user.role === "tutor") {
      user = await prisma.admin.findUnique({
        where: { id: req.user.id },
      });
    }

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: "User not found" },
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: { message: "Current password is incorrect" },
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    if (req.user.role === "admin") {
      await prisma.admin.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
      });
    } else if (req.user.role === "tutor") {
      await prisma.admin.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
      });
    }

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};