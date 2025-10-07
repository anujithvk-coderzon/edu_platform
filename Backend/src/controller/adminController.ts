import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

// Import prisma and types
import prisma from '../DB/DB_Config';
import { AuthRequest } from '../middleware/auth';
import { CourseStatus, MaterialType, EnrollmentStatus } from '@prisma/client';
import { recalculateAndUpdateProgress, calculateCourseProgress, calculateProgressFromCounts } from '../utils/progressCalculator';

// Define user role type since we're using string roles
type UserRole = "Admin" | "Tutor";

// Import utilities
import { deleteUploadedFile, deleteMultipleFiles } from '../utils/fileUtils';
import { generateOTP, storeOTP, verifyOTP, StoreForgetOtp, VerifyForgetOtp, ForgetPasswordMail, ClearForgetOtp, sendTutorVerificationEmail, sendTutorWelcomeEmail, StudentWelcomeEmail, StaffWelcomeEmail, sendTutorPendingApprovalEmail, sendTutorRejectionEmail, sendCourseRejectionEmail, sendCoursePublishedEmail } from '../utils/EmailVerification';
import { Upload_Files, Delete_File } from '../utils/CDN_management';
import { Upload_Files_Stream } from '../utils/CDN_streaming';
import { Upload_Files_Local, Delete_File_Local } from '../utils/localStorage';

// ===== UTILITY FUNCTIONS =====
const GenerateToken = (userId: string, type: 'admin' | 'student' = 'admin') => {
  return jwt.sign(
    { id: userId, type },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// Helper function to safely delete a course and its related resources
const safeDeleteCourse = async (courseId: string, reason?: string) => {
  try {
    console.log(`🗑️ Attempting to delete course ${courseId}${reason ? ` - Reason: ${reason}` : ''}`);

    // Get course details first
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        materials: true,
        modules: true,
        assignments: true,
        enrollments: true
      }
    });

    if (!course) {
      console.log(`❌ Course ${courseId} not found for deletion`);
      return false;
    }

    // Check if course has enrollments - if yes, don't delete for safety
    if (course.enrollments.length > 0) {
      console.log(`⚠️ Course ${courseId} has ${course.enrollments.length} enrollments, skipping deletion for safety`);
      return false;
    }

    // Delete associated CDN files
    for (const material of course.materials) {
      if (material.fileUrl) {
        try {
          await Delete_File(material.fileUrl);
          console.log(`✅ Deleted material file: ${material.fileUrl}`);
        } catch (error) {
          console.error(`❌ Failed to delete material file ${material.fileUrl}:`, error);
        }
      }
    }

    // Delete thumbnail from CDN
    if (course.thumbnail) {
      try {
        await Delete_File(course.thumbnail);
        console.log(`✅ Deleted course thumbnail: ${course.thumbnail}`);
      } catch (error) {
        console.error(`❌ Failed to delete course thumbnail ${course.thumbnail}:`, error);
      }
    }

    // Delete the course (cascade will handle related records)
    await prisma.course.delete({
      where: { id: courseId }
    });

    console.log(`✅ Successfully deleted course ${courseId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting course ${courseId}:`, error);
    return false;
  }
};

// ===== AUTH CONTROLLERS =====
export const BootstrapAdmin = async (req: express.Request, res: express.Response) => {
  try {
    // Check if ANY admin exists in the system
    const adminExists = await prisma.admin.findFirst();

    if (adminExists) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Bootstrap endpoint is disabled. First admin has already been created.',
          hint: 'This endpoint can only be used once for initial setup. Please use the normal authentication system.'
        }
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { email, password, firstName, lastName } = req.body;

    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: { message: 'Admin already exists with this email' }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "Admin",
        isActive: true, // Bootstrap admin should be active
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    const token = GenerateToken(user.id);

    // Set role-specific cookie names (BootstrapAdmin always creates ADMIN)
    const cookieName = 'admin_token';

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    console.error('BootstrapAdmin error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const RegisterUser = async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Validate role - default to Tutor if not specified or invalid
    const userRole = role === 'Admin' || role === 'Tutor' ? role : 'Tutor';

    const existingUser = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'User already exists with this email' }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // All users created by admin should be active by default
    const user = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: userRole,
        isActive: true,
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Send welcome email to the newly created user (Admin/Tutor)
    const emailResult = await StaffWelcomeEmail(email, firstName, userRole);
    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
      // Don't fail the user creation if email fails, just log it
    }

    // DO NOT generate token or set cookies when creating a user
    // This is a user creation endpoint, not a login endpoint
    // The admin should remain logged in as themselves

    return res.status(201).json({
      success: true,
      data: { user },
      message: `${userRole} created successfully and is active. A welcome email has been sent.`
    });
  } catch (error) {
    console.error('RegisterUser error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const RegisterTutor = async (req: AuthRequest, res: express.Response) => {
  try {
    // Only admins can register tutors
    if (req.user!.type !== "admin" || req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can register tutors' }
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { email, password, firstName, lastName } = req.body;

    const existingUser = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'User already exists with this email' }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const tutor = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "Tutor",
        isActive: false, // Admin must activate the tutor
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      success: true,
      data: { tutor },
      message: 'Tutor created successfully. Please activate the tutor account before they can login.'
    });
  } catch (error) {
    console.error('RegisterTutor error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// ===== PUBLIC TUTOR REGISTRATION WITH EMAIL VERIFICATION =====

export const CheckTutorEmail = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Please provide a valid email address', details: errors.array() }
    });
  }

  const { email } = req.body;
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });

  if (existingAdmin) {
    return res.status(400).json({
      success: false,
      error: { message: 'An account with this email already exists' }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Email is available',
    data: { email, available: true }
  });
};

export const SendTutorVerificationEmail = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Please provide a valid email address', details: errors.array() }
    });
  }

  const { email } = req.body;

  // Check if email already exists in admin table (active tutor/admin)
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });

  if (existingAdmin) {
    return res.status(400).json({
      success: false,
      error: { message: 'An account with this email already exists. Please login instead.' }
    });
  }

  // Check if there's already a tutor request
  const existingRequest = await prisma.tutorRequest.findUnique({ where: { email } });

  if (existingRequest) {
    return res.status(400).json({
      success: false,
      error: { message: 'A registration request with this email is already pending approval. Please wait for admin review.' }
    });
  }

  const otp = generateOTP();
  storeOTP(email, otp, null);
  const emailResult = await sendTutorVerificationEmail(email, otp);

  if (!emailResult.success) {
    return res.status(500).json({
      success: false,
      error: { message: emailResult.error || 'Failed to send verification email. Please try again.' }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Verification code sent to your email. Please check your inbox.',
    data: { email }
  });
};

export const VerifyTutorOTP = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { email, otp } = req.body;
  const verification = verifyOTP(email, otp);

  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      error: { message: verification.message || 'Invalid or expired OTP. Please try again.' }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now complete your registration.',
    data: { email, verified: true }
  });
};

export const RegisterTutorPublic = async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if email already exists in admin table
    const existingUser = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'User already exists with this email' }
      });
    }

    // Check if email already has a pending request
    const existingRequest = await prisma.tutorRequest.findUnique({
      where: { email }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: { message: 'A registration request with this email is already pending approval' }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Store registration request in tutor_request table
    const tutorRequest = await prisma.tutorRequest.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    // Send pending approval email to the tutor
    const emailResult = await sendTutorPendingApprovalEmail(email, firstName);
    if (!emailResult.success) {
      console.error('Failed to send pending approval email:', emailResult.error);
      // Don't fail the registration if email fails, just log it
    }

    return res.status(201).json({
      success: true,
      data: { tutorRequest },
      message: 'Tutor registration request submitted successfully. You will be notified once your request is reviewed by an admin.'
    });
  } catch (error) {
    console.error('RegisterTutorPublic error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const LoginUser = async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { email, password } = req.body;

    const user = await prisma.admin.findUnique({
      where: { email }
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' }
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is deactivated' }
      });
    }

    const token = GenerateToken(user.id);

    // Set role-specific cookie names
    const cookieName = 'admin_token'; // This is admin login, always use admin_token

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('LoginUser error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const LogoutUser = (req: AuthRequest, res: express.Response) => {
  // Only clear the cookie for the current user's type
  const cookieName = req.user!.type === "admin" ? 'admin_token' : 'student_token';
  res.clearCookie(cookieName);

  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Forgot Password for Admin - Step 1: Send OTP to email
export const AdminForgotPassword = async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide a valid email address', details: errors.array() }
      });
    }

    const { email } = req.body;

    // Check if admin exists with this email
    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      // Don't reveal if email exists for security reasons
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.',
        data: { email }
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP for forgot password
    StoreForgetOtp(email, otp);

    // Send OTP via email
    const emailResult = await ForgetPasswordMail(email, otp);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: { message: emailResult.error || 'Failed to send password reset email. Please try again.' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email. Please check your inbox.',
      data: { email }
    });
  } catch (error) {
    console.error('AdminForgotPassword error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Forgot Password for Admin - Step 2: Verify OTP
export const AdminVerifyForgotPasswordOtp = async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { email, otp } = req.body;

    // Verify OTP
    const verification = VerifyForgetOtp(email, otp);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: { message: verification.message || 'Invalid or expired OTP. Please try again.' }
      });
    }

    // OTP is valid, return success
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully! You can now reset your password.',
      data: { email, otpVerified: true }
    });
  } catch (error) {
    console.error('AdminVerifyForgotPasswordOtp error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Forgot Password for Admin - Step 3: Reset Password
export const AdminResetPassword = async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { email, otp, newPassword } = req.body;

    // Verify OTP again before resetting password
    const verification = VerifyForgetOtp(email, otp);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: { message: verification.message || 'Invalid or expired OTP. Please request a new password reset.' }
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the admin's password
    const updatedAdmin = await prisma.admin.update({
      where: { email },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    // Clear the OTP after successful password reset
    ClearForgetOtp(email);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.',
      data: {
        email: updatedAdmin.email,
        firstName: updatedAdmin.firstName,
        role: updatedAdmin.role
      }
    });
  } catch (error) {
    console.error('AdminResetPassword error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetCurrentUser = async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await prisma.admin.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('GetCurrentUser error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UpdateProfile = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const updates: any = {};
    const { firstName, lastName, avatar } = req.body;

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (avatar) updates.avatar = avatar;

    const user = await prisma.admin.update({
      where: { id: req.user!.id },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const ChangePassword = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.admin.findUnique({
      where: { id: req.user!.id }
    });

    if (!user || !await bcrypt.compare(currentPassword, user.password)) {
      return res.status(401).json({
        success: false,
        error: { message: 'Current password is incorrect' }
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.admin.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    });

    return res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('ChangePassword error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// ===== USER MANAGEMENT CONTROLLERS =====
export const GetAllUsers = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as UserRole;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.admin.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              createdCourses: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.admin.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetUserById = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdCourses: true,
            materials: true,
            assignments: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    return res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('GetUserById error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UpdateUser = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { id } = req.params;
    const updates: any = {};
    const { firstName, lastName, role, isActive, isVerified } = req.body;

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (role) updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (typeof isVerified === 'boolean') updates.isVerified = isVerified;

    const user = await prisma.admin.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isVerified: true,
        isActive: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('UpdateUser error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const DeleteUser = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete your own account' }
      });
    }

    await prisma.admin.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('DeleteUser error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetUserStats = async (req: AuthRequest, res: express.Response) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalCourses,
      totalEnrollments,
      recentUsers
    ] = await Promise.all([
      prisma.admin.count(),
      prisma.admin.count({ where: { role: "Admin" } }),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.admin.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalAdmins,
          totalCourses,
          totalEnrollments
        },
        recentUsers
      }
    });
  } catch (error) {
    console.error('GetUserStats error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// ===== TUTOR REQUEST CONTROLLERS =====
export const GetPendingTutorRequestsCount = async (req: AuthRequest, res: express.Response) => {
  try {
    // Only admins can view tutor requests
    if (req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can view tutor requests' }
      });
    }

    // Count all tutor requests (all are pending since processed ones are deleted)
    const count = await prisma.tutorRequest.count();

    return res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('GetPendingTutorRequestsCount error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetAllTutorRequests = async (req: AuthRequest, res: express.Response) => {
  try {
    // Only admins can view tutor requests
    if (req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can view tutor requests' }
      });
    }

    // Get all tutor requests (all are pending since processed ones are deleted)
    const requests = await prisma.tutorRequest.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    console.error('GetAllTutorRequests error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const AcceptTutorRequest = async (req: AuthRequest, res: express.Response) => {
  try {
    // Only admins can accept tutor requests
    if (req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can accept tutor requests' }
      });
    }

    const { requestId } = req.params;

    // Get the tutor request
    const tutorRequest = await prisma.tutorRequest.findUnique({
      where: { id: requestId }
    });

    if (!tutorRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tutor request not found' }
      });
    }

    // Check if email already exists (race condition protection)
    const existingUser = await prisma.admin.findUnique({
      where: { email: tutorRequest.email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'A user with this email already exists' }
      });
    }

    // Create the tutor account and delete the request in a transaction
    const tutor = await prisma.$transaction(async (tx) => {
      // Create the tutor account
      const newTutor = await tx.admin.create({
        data: {
          email: tutorRequest.email,
          password: tutorRequest.password, // Already hashed
          firstName: tutorRequest.firstName,
          lastName: tutorRequest.lastName,
          role: "Tutor",
          isActive: true,
          isVerified: true
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      // Delete the tutor request after successful account creation
      await tx.tutorRequest.delete({
        where: { id: requestId }
      });

      return newTutor;
    });

    // Send welcome email to the tutor
    const emailResult = await sendTutorWelcomeEmail(tutor.email, tutor.firstName);
    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
      // Don't fail the request acceptance if email fails
    }

    return res.json({
      success: true,
      data: { tutor },
      message: 'Tutor request accepted successfully. Welcome email has been sent.'
    });
  } catch (error) {
    console.error('AcceptTutorRequest error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const RejectTutorRequest = async (req: AuthRequest, res: express.Response) => {
  try {
    // Only admins can reject tutor requests
    if (req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can reject tutor requests' }
      });
    }

    const { requestId } = req.params;

    // Get the tutor request
    const tutorRequest = await prisma.tutorRequest.findUnique({
      where: { id: requestId }
    });

    if (!tutorRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tutor request not found' }
      });
    }

    // Send rejection email first, then delete the request
    const emailResult = await sendTutorRejectionEmail(tutorRequest.email, tutorRequest.firstName);
    if (!emailResult.success) {
      console.error('Failed to send rejection email:', emailResult.error);
      // Don't fail the request rejection if email fails
    }

    // Delete the tutor request
    await prisma.tutorRequest.delete({
      where: { id: requestId }
    });

    return res.json({
      success: true,
      message: 'Tutor request rejected successfully. Rejection email has been sent.'
    });
  } catch (error) {
    console.error('RejectTutorRequest error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// ===== COURSE CONTROLLERS =====
export const GetAllCourses = async (req: AuthRequest, res: express.Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const category = req.query.category as string;
    const level = req.query.level as string;
    const search = req.query.search as string;
    const status = req.query.status as CourseStatus;
    const skip = (page - 1) * limit;

    const where: any = {
      status: status || CourseStatus.PUBLISHED,
      isPublic: true
    };

    if (category) {
      where.category = { name: { contains: category, mode: 'insensitive' } };
    }

    if (level) {
      where.level = { contains: level, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
              materials: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.course.count({ where })
    ]);

    const coursesWithAvgRating = await Promise.all(
      courses.map(async (course) => {
        const avgRating = await prisma.review.aggregate({
          where: { courseId: course.id },
          _avg: { rating: true }
        });

        return {
          ...course,
          averageRating: avgRating._avg.rating || 0
        };
      })
    );

    return res.json({
      success: true,
      data: {
        courses: coursesWithAvgRating,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('GetAllCourses error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetMyCourses = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role; // This is the specific admin role (admin/tutor)

    let whereClause: any = {};

    if (userRole === "Admin") {
      // Admin has complete access - can see ALL courses regardless of creator/tutor
      whereClause = {};
    } else if (userRole === "Tutor") {
      // Tutor can ONLY see:
      // 1. Courses they created (creatorId = their ID)
      // 2. Courses assigned to them by admin (tutorId = their ID)
      whereClause = {
        OR: [
          { creatorId: userId },  // Courses they created
          { tutorId: userId }     // Courses assigned to them by admin
        ]
      };
    } else {
      // Other roles (like students) can only see courses they created (if any)
      whereClause = { creatorId: userId };
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            materials: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    console.error('GetMyCourses error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetAllTutors = async (req: AuthRequest, res: express.Response) => {
  try {
    // Only admins can get all tutors
    if (req.user!.type !== "admin" || req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    // Support optional filtering for active tutors only
    const activeOnly = req.query.activeOnly === 'true';

    const whereClause: any = { role: "Tutor" };
    if (activeOnly) {
      whereClause.isActive = true;
    }

    const tutors = await prisma.admin.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        createdCourses: {
          select: { id: true }
        },
        assignedCourses: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Count unique courses (avoid double counting when tutor is both creator and assigned)
    const tutorsWithTotalCourses = tutors.map(tutor => {
      const createdIds = new Set(tutor.createdCourses.map(c => c.id));
      const assignedIds = new Set(tutor.assignedCourses.map(c => c.id));
      const uniqueCourseIds = new Set([...createdIds, ...assignedIds]);

      return {
        id: tutor.id,
        email: tutor.email,
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        avatar: tutor.avatar,
        isActive: tutor.isActive,
        createdAt: tutor.createdAt,
        _count: {
          createdCourses: uniqueCourseIds.size
        }
      };
    });

    return res.json({
      success: true,
      data: { tutors: tutorsWithTotalCourses }
    });
  } catch (error) {
    console.error('GetAllTutors error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const ToggleTutorStatus = async (req: AuthRequest, res: express.Response) => {
  try {
    // Only admins can toggle tutor status
    if (req.user!.type !== "admin" || req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can modify tutor status' }
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    // Check if tutor exists
    const tutor = await prisma.admin.findUnique({
      where: { id, role: 'Tutor' }
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tutor not found' }
      });
    }

    // Update tutor status
    const updatedTutor = await prisma.admin.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    // Note: Welcome emails are only sent during initial account creation
    // or when accepting tutor registration requests, not when toggling status

    return res.json({
      success: true,
      data: { tutor: updatedTutor },
      message: `Tutor ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('ToggleTutorStatus error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetCourseById = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // First check if course exists
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        modules: {
          include: {
            materials: {
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                fileUrl: true,
                content: true,
                orderIndex: true,
                isPublic: true
              },
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        reviews: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            enrollments: true,
            materials: true,
            reviews: true
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    // Access control: Tutors can only access courses they created or are assigned to
    if (userRole === "Tutor") {
      const hasAccess = course.creatorId === userId || course.tutorId === userId;
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied. You can only view courses you created or are assigned to.' }
        });
      }
    }
    // Admins have access to all courses (no additional check needed)

    const avgRating = await prisma.review.aggregate({
      where: { courseId: course.id },
      _avg: { rating: true }
    });

    let isEnrolled = false;
    if (req.user) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: course.id
          }
        }
      });
      isEnrolled = !!enrollment;
    }

    return res.json({
      success: true,
      data: {
        course: {
          ...course,
          averageRating: avgRating._avg.rating || 0,
          isEnrolled
        }
      }
    });
  } catch (error) {
    console.error('GetCourseById error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const CreateCourse = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const {
      title,
      description,
      price = 0,
      duration,
      level,
      categoryId,
      thumbnail,
      tutorName,
      tutorId,
      objectives = [],
      requirements = [],
      tags = []
    } = req.body;

    // If tutorId is provided, verify it's a valid tutor and get their name
    let assignedTutorName = null;
    if (tutorId) {
      const tutor = await prisma.admin.findUnique({
        where: { id: tutorId }
      });

      if (!tutor || tutor.role !== "Tutor") {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid tutor ID' }
        });
      }

      assignedTutorName = `${tutor.firstName} ${tutor.lastName}`;
    }

    // Use a transaction to ensure atomicity
    const course = await prisma.$transaction(async (tx) => {
      // Create the course within the transaction
      const newCourse = await tx.course.create({
        data: {
          title,
          description,
          price: parseFloat(price),
          duration: duration ? parseInt(duration) : null,
          level,
          ...(categoryId && { categoryId }),
          thumbnail,
          tutorName: tutorName || assignedTutorName || `${req.user!.firstName} ${req.user!.lastName}`,
          creatorId: req.user!.id,
          ...(tutorId && { tutorId }), // Save the assigned tutor ID
          status: CourseStatus.DRAFT,
          requirements,
          prerequisites: objectives
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true
            }
          },
          tutor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // If the course creation fails, the transaction will automatically rollback
      return newCourse;
    });

    return res.status(201).json({
      success: true,
      data: { course }
    });
  } catch (error) {
    console.error('CreateCourse error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UpdateCourse = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { id } = req.params;
    const updates: any = {};

    const {
      title,
      description,
      price,
      duration,
      level,
      categoryId,
      thumbnail,
      tutorName,
      tutorId,
      status,
      isPublic
    } = req.body;

    if (title) updates.title = title;
    if (description) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (duration) updates.duration = parseInt(duration);
    if (level) updates.level = level;
    if (categoryId) updates.categoryId = categoryId;
    if (thumbnail) updates.thumbnail = thumbnail;
    if (tutorName) updates.tutorName = tutorName;
    if (tutorId !== undefined) updates.tutorId = tutorId;
    if (status) updates.status = status;
    if (typeof isPublic === 'boolean') updates.isPublic = isPublic;

    // If tutorId is provided, verify it's a valid tutor and set tutorName automatically
    if (tutorId) {
      const tutor = await prisma.admin.findUnique({
        where: { id: tutorId }
      });

      if (!tutor || tutor.role !== "Tutor") {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid tutor ID' }
        });
      }

      // Automatically set tutorName to the assigned tutor's name if not explicitly provided
      if (!tutorName) {
        updates.tutorName = `${tutor.firstName} ${tutor.lastName}`;
      }
    }

    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    // Access control: Admin can edit any course, Tutors can only edit courses they created or are assigned to
    if (req.user!.role !== "Admin") {
      const hasAccess = existingCourse.creatorId === req.user!.id || existingCourse.tutorId === req.user!.id;
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied. You can only edit courses you created or are assigned to.' }
        });
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: updates,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    console.error('UpdateCourse error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Tutor submits course for admin review
export const SubmitCourseForReview = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    // Only course creator or assigned tutor can submit for review
    const hasAccess = course.creatorId === req.user!.id || course.tutorId === req.user!.id;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to submit this course' }
      });
    }

    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      return res.status(400).json({
        success: false,
        error: { message: 'Only draft or rejected courses can be submitted for review' }
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        status: CourseStatus.PENDING_REVIEW,
        rejectionReason: null, // Clear rejection reason when resubmitting
        rejectedAt: null
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: {
        course: updatedCourse,
        message: 'Course submitted for review successfully!'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Admin-only: Publish course (approve)
export const PublishCourse = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;

    // Only admins can publish courses
    if (req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can publish courses' }
      });
    }

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    if (course.status === CourseStatus.PUBLISHED) {
      return res.status(400).json({
        success: false,
        error: { message: 'Course is already published' }
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        status: CourseStatus.PUBLISHED,
        isPublic: true,
        rejectionReason: null, // Clear any previous rejection reason
        rejectedAt: null
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true
          }
        },
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            materials: true,
            reviews: true
          }
        }
      }
    });

    // Send email notification to course creator/tutor about publication
    const recipientEmail = updatedCourse.tutor?.email || updatedCourse.creator.email;
    const recipientName = updatedCourse.tutor ?
      `${updatedCourse.tutor.firstName} ${updatedCourse.tutor.lastName}` :
      `${updatedCourse.creator.firstName} ${updatedCourse.creator.lastName}`;

    await sendCoursePublishedEmail(recipientEmail, recipientName, updatedCourse.title);

    return res.json({
      success: true,
      data: {
        course: updatedCourse,
        message: 'Course published successfully! Notification email has been sent.'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Admin-only: Reject course
export const RejectCourse = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional rejection reason

    // Only admins can reject courses
    if (req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can reject courses' }
      });
    }

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    if (course.status !== CourseStatus.PENDING_REVIEW) {
      return res.status(400).json({
        success: false,
        error: { message: 'Only pending courses can be rejected' }
      });
    }

    // Set course to REJECTED status
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        status: CourseStatus.REJECTED,
        isPublic: false,
        rejectionReason: reason || 'No reason provided',
        rejectedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true
          }
        },
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Send email notification to course creator/tutor with rejection reason
    const recipientEmail = updatedCourse.tutor?.email || updatedCourse.creator.email;
    const recipientName = updatedCourse.tutor ?
      `${updatedCourse.tutor.firstName} ${updatedCourse.tutor.lastName}` :
      `${updatedCourse.creator.firstName} ${updatedCourse.creator.lastName}`;

    await sendCourseRejectionEmail(recipientEmail, recipientName, updatedCourse.title, reason || 'No reason provided');

    return res.json({
      success: true,
      data: {
        course: updatedCourse,
        message: 'Course rejected successfully. Notification email has been sent.'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Admin-only: Get pending courses count
export const GetPendingCoursesCount = async (req: AuthRequest, res: express.Response) => {
  try {
    // Only admins can view pending courses count
    if (req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can view pending courses' }
      });
    }

    const count = await prisma.course.count({
      where: { status: CourseStatus.PENDING_REVIEW }
    });

    return res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Admin-only: Get all pending courses
export const GetPendingCourses = async (req: AuthRequest, res: express.Response) => {
  try {
    // Only admins can view pending courses
    if (req.user!.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can view pending courses' }
      });
    }

    const courses = await prisma.course.findMany({
      where: { status: CourseStatus.PENDING_REVIEW },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true
          }
        },
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            materials: true,
            modules: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const DeleteCourse = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        thumbnail: true, // Explicitly select thumbnail for deletion
        creatorId: true,
        tutorId: true, // Add tutorId for access control
        materials: {
          select: {
            id: true,
            fileUrl: true,
            type: true
          }
        },
        assignments: {
          select: {
            id: true,
            title: true,
            submissions: {
              select: {
                id: true,
                fileUrl: true,
                studentId: true
              }
            }
          }
        },
        enrollments: {
          select: {
            id: true,
            status: true,
            progressPercentage: true
          }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    // Access control: Admin can delete any course, Tutors can delete courses they created or are assigned to
    if (req.user!.role !== "Admin") {
      const hasAccess = course.creatorId === req.user!.id || course.tutorId === req.user!.id;
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to delete this course' }
        });
      }
    }

    // Check for active enrollments (not completed)
    const activeEnrollments = course.enrollments.filter(
      enrollment => enrollment.status !== EnrollmentStatus.COMPLETED && enrollment.progressPercentage < 100
    );

    if (activeEnrollments.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: `Cannot delete course with ${activeEnrollments.length} active enrollment(s). Wait for students to complete the course or manually mark enrollments as completed.` }
      });
    }

    // Delete all associated material files from CDN
    const materialFileUrls = course.materials
      .filter(material => material.fileUrl && material.type !== 'LINK')
      .map(material => material.fileUrl!);

    let deletedMaterialsCount = 0;
    for (const fileUrl of materialFileUrls) {
      try {
        // fileUrl should already be in format "folder/filename"
        const deleted = await Delete_File(fileUrl);
        if (deleted) {
          deletedMaterialsCount++;
          console.log(`✅ Deleted material: ${fileUrl}`);
        } else {
          console.log(`⚠️ Failed to delete material: ${fileUrl}`);
        }
      } catch (err) {
        console.error(`❌ Error deleting material file: ${fileUrl}`, err);
      }
    }
    console.log(`🗑️ Deleted ${deletedMaterialsCount}/${materialFileUrls.length} material files for course: ${course.title}`);

    // Delete all assignment submission files from CDN
    let deletedSubmissionsCount = 0;
    let totalSubmissionFiles = 0;
    for (const assignment of course.assignments) {
      const submissionFiles = assignment.submissions.filter(sub => sub.fileUrl);
      totalSubmissionFiles += submissionFiles.length;

      for (const submission of submissionFiles) {
        if (submission.fileUrl) {
          try {
            // fileUrl should already be in format "folder/filename"
            const deleted = await Delete_File(submission.fileUrl);
            if (deleted) {
              deletedSubmissionsCount++;
              console.log(`✅ Deleted assignment submission: ${submission.fileUrl}`);
            } else {
              console.log(`⚠️ Failed to delete submission: ${submission.fileUrl}`);
            }
          } catch (err) {
            console.error(`❌ Error deleting submission file: ${submission.fileUrl}`, err);
          }
        }
      }
    }
    if (totalSubmissionFiles > 0) {
      console.log(`📄 Deleted ${deletedSubmissionsCount}/${totalSubmissionFiles} assignment submission files`);
    }

    // Delete course thumbnail from CDN if it exists
    if (course.thumbnail) {
      try {
        // thumbnail should already be in format "folder/filename"
        const thumbnailDeleted = await Delete_File(course.thumbnail);
        if (thumbnailDeleted) {
          console.log(`🖼️ Successfully deleted thumbnail: ${course.thumbnail}`);
        } else {
          console.log(`⚠️ Failed to delete thumbnail: ${course.thumbnail}`);
        }
      } catch (err) {
        console.error(`❌ Error deleting thumbnail: ${course.thumbnail}`, err);
      }
    } else {
      console.log(`📝 No thumbnail to delete for course: ${course.title}`);
    }

    // Now delete the course from database (this will cascade delete related records)
    await prisma.course.delete({
      where: { id }
    });

    const deletionSummary = {
      courseName: course.title,
      deletedMaterials: `${deletedMaterialsCount}/${materialFileUrls.length}`,
      deletedSubmissions: `${deletedSubmissionsCount}/${totalSubmissionFiles}`,
      thumbnailDeleted: course.thumbnail ? 'Yes' : 'N/A'
    };

    console.log('📊 Course deletion summary:', deletionSummary);

    return res.json({
      success: true,
      message: 'Course and all associated files deleted successfully',
      summary: deletionSummary
    });
  } catch (error) {
    console.error('DeleteCourse error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// ===== CATEGORY CONTROLLERS =====
export const GetAllCategories = async (req: express.Request, res: express.Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { courses: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('GetAllCategories error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetCategoryById = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            _count: {
              select: { enrollments: true }
            }
          }
        },
        _count: {
          select: { courses: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }

    return res.json({
      success: true,
      data: { category }
    });
  } catch (error) {
    console.error('GetCategoryById error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const CreateCategory = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { name, description } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: { message: 'Category with this name already exists' }
      });
    }

    const category = await prisma.category.create({
      data: { name, description }
    });

    return res.status(201).json({
      success: true,
      data: { category }
    });
  } catch (error) {
    console.error('CreateCategory error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UpdateCategory = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { id } = req.params;
    const updates: any = {};
    
    const { name, description } = req.body;

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    if (name) {
      const existingCategory = await prisma.category.findFirst({
        where: { 
          name,
          NOT: { id }
        }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: { message: 'Category with this name already exists' }
        });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: updates
    });

    return res.json({
      success: true,
      data: { category }
    });
  } catch (error) {
    console.error('UpdateCategory error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const DeleteCategory = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }

    if (category._count.courses > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete category with existing courses' }
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('DeleteCategory error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// ===== MODULE CONTROLLERS =====
export const GetCourseModules = async (req: AuthRequest, res: express.Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    if (course.creatorId !== userId && userRole !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      include: {
        materials: {
          select: {
            id: true,
            title: true,
            type: true,
            orderIndex: true,
            createdAt: true
          },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    return res.json({
      success: true,
      data: { modules }
    });
  } catch (error) {
    console.error('GetCourseModules error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetModuleById = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const module = await prisma.courseModule.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            creatorId: true
          }
        },
        materials: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: { message: 'Module not found' }
      });
    }

    if (module.course.creatorId !== userId && userRole !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    return res.json({
      success: true,
      data: { module }
    });
  } catch (error) {
    console.error('GetModuleById error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const CreateModule = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { title, description, orderIndex, courseId } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    // Access control: Admin can add modules to any course, Tutors can add modules to courses they created or are assigned to
    if (userRole !== "Admin") {
      const hasAccess = course.creatorId === userId || course.tutorId === userId;
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to add modules to this course' }
        });
      }
    }

    const module = await prisma.courseModule.create({
      data: {
        title,
        description,
        orderIndex: parseInt(orderIndex),
        courseId
      },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        },
        materials: true
      }
    });

    return res.status(201).json({
      success: true,
      data: { module }
    });
  } catch (error) {
    console.error('CreateModule error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UpdateModule = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { id } = req.params;
    const updates: any = {};
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    const { title, description, orderIndex } = req.body;

    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (orderIndex !== undefined) updates.orderIndex = parseInt(orderIndex);

    const existingModule = await prisma.courseModule.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            creatorId: true,
            tutorId: true
          }
        }
      }
    });

    if (!existingModule) {
      return res.status(404).json({
        success: false,
        error: { message: 'Module not found' }
      });
    }

    // Access control: Admin can update any module, Tutors can update modules in courses they created or are assigned to
    if (userRole !== "Admin") {
      const hasAccess = existingModule.course.creatorId === userId || existingModule.course.tutorId === userId;
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to update this module' }
        });
      }
    }

    const module = await prisma.courseModule.update({
      where: { id },
      data: updates,
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        },
        materials: {
          select: {
            id: true,
            title: true,
            type: true,
            orderIndex: true
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    return res.json({
      success: true,
      data: { module }
    });
  } catch (error) {
    console.error('UpdateModule error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const DeleteModule = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const module = await prisma.courseModule.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            creatorId: true,
            tutorId: true
          }
        },
        _count: {
          select: { materials: true }
        }
      }
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: { message: 'Module not found' }
      });
    }

    // Access control: Admin can delete any module, Tutors can delete modules in courses they created or are assigned to
    if (userRole !== "Admin") {
      const hasAccess = module.course.creatorId === userId || module.course.tutorId === userId;
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to delete this module' }
        });
      }
    }

    if (module._count.materials > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete module with existing materials' }
      });
    }

    await prisma.courseModule.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    console.error('DeleteModule error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const ReorderModule = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { newOrderIndex } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const module = await prisma.courseModule.findUnique({
      where: { id },
      include: {
        course: {
          select: { creatorId: true }
        }
      }
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: { message: 'Module not found' }
      });
    }

    if (module.course.creatorId !== userId && userRole !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to reorder this module' }
      });
    }

    const updatedModule = await prisma.courseModule.update({
      where: { id },
      data: { orderIndex: parseInt(newOrderIndex) }
    });

    return res.json({
      success: true,
      data: { module: updatedModule }
    });
  } catch (error) {
    console.error('ReorderModule error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// ===== MATERIAL CONTROLLERS =====
export const GetCourseMaterials = async (req: AuthRequest, res: express.Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    const materials = await prisma.material.findMany({
      where: { courseId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        module: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { moduleId: 'asc' },
        { orderIndex: 'asc' }
      ]
    });

    return res.json({
      success: true,
      data: { materials }
    });
  } catch (error) {
    console.error('GetCourseMaterials error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetMaterialById = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            creatorId: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        module: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: { message: 'Material not found' }
      });
    }

    await prisma.progress.upsert({
      where: {
        studentId_courseId_materialId: {
          studentId: userId,
          courseId: material.courseId,
          materialId: material.id
        }
      },
      update: {
        lastAccessed: new Date(),
        timeSpent: { increment: 1 }
      },
      create: {
        studentId: userId,
        courseId: material.courseId,
        materialId: material.id,
        lastAccessed: new Date(),
        timeSpent: 1
      }
    });

    return res.json({
      success: true,
      data: { material }
    });
  } catch (error) {
    console.error('GetMaterialById error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const CreateMaterial = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const {
      title,
      description,
      type,
      fileUrl,
      content,
      orderIndex,
      courseId,
      moduleId,
      isPublic = false
    } = req.body;

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    // Access control: Admin can add materials to any course, Tutors can add materials to courses they created or are assigned to
    if (req.user!.role !== "Admin") {
      const hasAccess = course.creatorId === req.user!.id || course.tutorId === req.user!.id;
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to add materials to this course' }
        });
      }
    }

    if (type === MaterialType.LINK && !fileUrl) {
      return res.status(400).json({
        success: false,
        error: { message: 'File URL is required for LINK type materials' }
      });
    }

    const material = await prisma.material.create({
      data: {
        title,
        description,
        type,
        fileUrl,
        content,
        orderIndex: parseInt(orderIndex),
        courseId,
        moduleId,
        authorId: req.user!.id,
        isPublic
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        module: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: { material }
    });
  } catch (error) {
    console.error('CreateMaterial error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UpdateMaterial = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { id } = req.params;
    const updates: any = {};
    
    const {
      title,
      description,
      type,
      fileUrl,
      content,
      orderIndex,
      moduleId,
      isPublic
    } = req.body;

    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (type) updates.type = type;
    if (fileUrl !== undefined) updates.fileUrl = fileUrl;
    if (content !== undefined) updates.content = content;
    if (orderIndex !== undefined) updates.orderIndex = parseInt(orderIndex);
    if (moduleId !== undefined) updates.moduleId = moduleId;
    if (typeof isPublic === 'boolean') updates.isPublic = isPublic;

    const existingMaterial = await prisma.material.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            creatorId: true,
            tutorId: true
          }
        }
      }
    });

    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        error: { message: 'Material not found' }
      });
    }

    // Access control: Admin can update materials in any course, Tutors can update materials in courses they created or are assigned to
    if (req.user!.role !== "Admin") {
      const hasAccess = existingMaterial.course.creatorId === req.user!.id || existingMaterial.course.tutorId === req.user!.id;
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to update this material' }
        });
      }
    }

    const material = await prisma.material.update({
      where: { id },
      data: updates,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        module: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: { material }
    });
  } catch (error) {
    console.error('UpdateMaterial error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const DeleteMaterial = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            creatorId: true,
            tutorId: true
          }
        }
      }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: { message: 'Material not found' }
      });
    }

    // Access control: Admin can delete materials from any course, Tutors can delete materials from courses they created or are assigned to
    if (req.user!.role !== "Admin") {
      const hasAccess = material.course.creatorId === req.user!.id || material.course.tutorId === req.user!.id;
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to delete this material' }
        });
      }
    }

    // Delete the file from CDN if it exists
    if (material.fileUrl && material.type !== 'LINK') {
      await Delete_File(material.fileUrl);
    }

    // Delete the material from database
    await prisma.material.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Material and associated file deleted successfully'
    });
  } catch (error) {
    console.error('DeleteMaterial error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const CompleteMaterial = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const material = await prisma.material.findUnique({
      where: { id },
      select: {
        id: true,
        courseId: true,
        course: {
          select: {
            creatorId: true,
            tutorId: true
          }
        }
      }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: { message: 'Material not found' }
      });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userId,
          courseId: material.courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: { message: 'You are not enrolled in this course' }
      });
    }

    await prisma.progress.upsert({
      where: {
        studentId_courseId_materialId: {
          studentId: userId,
          courseId: material.courseId,
          materialId: material.id
        }
      },
      update: {
        isCompleted: true,
        lastAccessed: new Date()
      },
      create: {
        studentId: userId,
        courseId: material.courseId,
        materialId: material.id,
        isCompleted: true,
        lastAccessed: new Date()
      }
    });

    // Use centralized progress calculator (includes both materials AND assignments)
    const stats = await recalculateAndUpdateProgress(userId, material.courseId);

    return res.json({
      success: true,
      data: {
        progressPercentage: stats.progressPercentage,
        isCompleted: true
      }
    });
  } catch (error) {
    console.error('CompleteMaterial error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// ===== ENROLLMENT CONTROLLERS =====
export const EnrollInCourse = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { courseId } = req.body;
    const userId = req.user!.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    if (!course.isPublic || course.status !== CourseStatus.PUBLISHED) {
      return res.status(400).json({
        success: false,
        error: { message: 'Course is not available for enrollment' }
      });
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: { message: 'Already enrolled in this course' }
      });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: userId,
        courseId,
        status: EnrollmentStatus.ACTIVE
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: { enrollment }
    });
  } catch (error) {
    console.error('EnrollInCourse error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetMyEnrollments = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user!.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      include: {
        course: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            _count: {
              select: {
                materials: true,
                reviews: true
              }
            }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progressRecords = await prisma.progress.findMany({
          where: {
            studentId: userId,
            courseId: enrollment.courseId
          }
        });

        const completedCount = progressRecords.filter(p => p.isCompleted).length;
        const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);

        return {
          ...enrollment,
          completedMaterials: completedCount,
          totalTimeSpent
        };
      })
    );

    return res.json({
      success: true,
      data: { enrollments: enrollmentsWithProgress }
    });
  } catch (error) {
    console.error('GetMyEnrollments error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetCourseStudents = async (req: AuthRequest, res: express.Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    if (course.creatorId !== userId && userRole !== "Admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to view course students' }
      });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    const studentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progressRecords = await prisma.progress.findMany({
          where: {
            studentId: enrollment.studentId,
            courseId
          }
        });

        const completedCount = progressRecords.filter(p => p.isCompleted).length;
        const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
        const lastAccessed = progressRecords.length > 0 
          ? Math.max(...progressRecords.map(p => p.lastAccessed.getTime()))
          : null;

        return {
          ...enrollment,
          completedMaterials: completedCount,
          totalTimeSpent,
          lastAccessed: lastAccessed ? new Date(lastAccessed) : null
        };
      })
    );

    return res.json({
      success: true,
      data: { students: studentsWithProgress }
    });
  } catch (error) {
    console.error('GetCourseStudents error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UpdateEnrollmentStatus = async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { enrollmentId } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          select: {
            creatorId: true,
            tutorId: true
          }
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Enrollment not found' }
      });
    }

    const canModify = enrollment.studentId === userId ||
                     enrollment.course.creatorId === userId ||
                     req.user!.role === "Admin";

    if (!canModify) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to modify this enrollment' }
      });
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
        ...(status === EnrollmentStatus.COMPLETED && { completedAt: new Date() })
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: { enrollment: updatedEnrollment }
    });
  } catch (error) {
    console.error('UpdateEnrollmentStatus error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetEnrollmentProgress = async (req: AuthRequest, res: express.Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Enrollment not found' }
      });
    }

    const [materials, progressRecords] = await Promise.all([
      prisma.material.findMany({
        where: { courseId },
        select: {
          id: true,
          title: true,
          type: true,
          moduleId: true,
          orderIndex: true
        },
        orderBy: [
          { moduleId: 'asc' },
          { orderIndex: 'asc' }
        ]
      }),
      prisma.progress.findMany({
        where: {
          studentId: userId,
          courseId
        }
      })
    ]);

    const progressMap = new Map(
      progressRecords.map(p => [p.materialId, p])
    );

    const materialsWithProgress = materials.map(material => ({
      ...material,
      progress: progressMap.get(material.id) || null
    }));

    const completedMaterials = progressRecords.filter(p => p.isCompleted).length;
    const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);

    // Use centralized progress calculator to include both materials AND assignments
    const progressStats = await calculateCourseProgress(userId, courseId);

    return res.json({
      success: true,
      data: {
        enrollment,
        materials: materialsWithProgress,
        stats: {
          totalMaterials: progressStats.totalMaterials,
          completedMaterials: progressStats.completedMaterials,
          totalAssignments: progressStats.totalAssignments,
          submittedAssignments: progressStats.submittedAssignments,
          progressPercentage: progressStats.progressPercentage,
          totalTimeSpent
        }
      }
    });
  } catch (error) {
    console.error('GetEnrollmentProgress error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const DeleteEnrollment = async (req: AuthRequest, res: express.Response) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user!.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          select: {
            creatorId: true,
            title: true
          }
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Enrollment not found' }
      });
    }

    const canDelete = enrollment.studentId === userId ||
                     enrollment.course.creatorId === userId ||
                     req.user!.role === "Admin";

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this enrollment' }
      });
    }

    await prisma.enrollment.delete({
      where: { id: enrollmentId }
    });

    return res.json({
      success: true,
      message: 'Enrollment cancelled successfully'
    });
  } catch (error) {
    console.error('DeleteEnrollment error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// ===== UPLOAD CONTROLLERS =====
// Note: File upload middleware configuration would be set up separately in the route file
export const UploadSingleFile = async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('UploadSingleFile error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UploadMultipleFiles = async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No files uploaded' }
      });
    }
    
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      path: file.path
    }));

    return res.json({
      success: true,
      data: { files: uploadedFiles }
    });
  } catch (error) {
    console.error('UploadMultipleFiles error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UploadAvatar = async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No avatar file uploaded' }
      });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: { message: 'Avatar must be an image file' }
      });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    // Get current user to check for existing avatar
    const currentUser = await prisma.admin.findUnique({
      where: { id: req.user!.id },
      select: { avatar: true }
    });

    // Delete old avatar if it exists
    if (currentUser?.avatar) {
      deleteUploadedFile(currentUser.avatar);
    }

    await prisma.admin.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl }
    });

    return res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: avatarUrl,
        message: 'Avatar updated successfully'
      }
    });
  } catch (error) {
    console.error('UploadAvatar error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UploadCourseThumbnail = async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No thumbnail file uploaded' }
      });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: { message: 'Thumbnail must be an image file' }
      });
    }

    const { courseId } = req.body;

    // Upload file to CDN in images folder
    const thumbnailUrl = await Upload_Files('images', req.file);

    if (!thumbnailUrl) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to upload thumbnail to CDN' }
      });
    }

    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          error: { message: 'Course not found' }
        });
      }

      if (course.creatorId !== req.user!.id && req.user!.role !== "Admin") {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to update this course' }
        });
      }

      // Get current course to check for existing thumbnail
      const currentCourse = await prisma.course.findUnique({
        where: { id: courseId },
        select: { thumbnail: true }
      });

      // Delete old thumbnail from CDN if it exists
      if (currentCourse?.thumbnail) {
        await Delete_File(currentCourse.thumbnail);
      }

      await prisma.course.update({
        where: { id: courseId },
        data: { thumbnail: thumbnailUrl }
      });

      return res.json({
        success: true,
        data: {
          filename: req.file.originalname,
          url: thumbnailUrl,
          message: 'Course thumbnail updated successfully'
        }
      });
    } else {
      return res.json({
        success: true,
        data: {
          filename: req.file.originalname,
          url: thumbnailUrl
        }
      });
    }
  } catch (error) {
    console.error('UploadCourseThumbnail error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const UploadMaterial = async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No material file uploaded' }
      });
    }

    const { courseId } = req.body;

    // Log file details for debugging
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Processing upload: ${req.file.originalname} (${fileSizeMB} MB)`);

    // Choose storage method based on environment
    let fileUrl: string | null = null;

    if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_STORAGE === 'true') {
      // Use local storage for development
      console.log('📂 Using local storage for development');
      fileUrl = await Upload_Files_Local('materials', req.file);
    } else {
      // Use Bunny CDN for production or when explicitly configured
      console.log('☁️ Using Bunny CDN storage');
      fileUrl = req.file.size > 20 * 1024 * 1024
        ? await Upload_Files_Stream('materials', req.file)
        : await Upload_Files('materials', req.file);
    }

    if (!fileUrl) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to upload material to CDN' }
      });
    }

    // If courseId is provided, verify user has access
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          error: { message: 'Course not found' }
        });
      }

      // Access control: Admin can upload to any course, Tutors can upload to courses they created or are assigned to
      if (req.user!.role !== "Admin") {
        const hasAccess = course.creatorId === req.user!.id || course.tutorId === req.user!.id;
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: { message: 'Not authorized to upload materials for this course' }
          });
        }
      }
    }

    return res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileUrl: fileUrl,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('UploadMaterial error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const DeleteUploadedFile = async (req: AuthRequest, res: express.Response) => {
  try {
    const { filename } = req.params;
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    try {
      fs.unlinkSync(filePath);
      
      return res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to delete file' }
      });
    }
  } catch (error) {
    console.error('DeleteUploadedFile error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetFileInfo = async (req: AuthRequest, res: express.Response) => {
  try {
    const { filename } = req.params;
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    const stats = fs.statSync(filePath);
    const extension = path.extname(filename);

    return res.json({
      success: true,
      data: {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        extension,
        url: `/uploads/${filename}`
      }
    });
  } catch (error) {
    console.error('GetFileInfo error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// ===== ANALYTICS CONTROLLERS =====
export const GetTutorAnalytics = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Build where clause based on role
    let whereClause: any = {};

    if (userRole === 'Admin') {
      // Admins see ALL courses
      whereClause = {};
    } else {
      // Tutors see only their courses (created or assigned)
      whereClause = {
        OR: [
          { creatorId: userId },
          { tutorId: userId }
        ]
      };
    }

    // Get courses with enrollment counts and reviews
    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            enrollments: true,
            materials: true,
            reviews: true
          }
        },
        materials: true,
        reviews: {
          select: {
            rating: true
          }
        },
        enrollments: {
          select: {
            id: true,
            studentId: true,
            courseId: true,
            status: true,
            progressPercentage: true,
            enrolledAt: true,
            completedAt: true
          }
        }
      }
    });

    // Calculate completion rates based on actual progress data
    let totalMaterials = 0;
    let totalCompletedMaterials = 0;
    let totalEnrollments = 0;
    let totalEarnings = 0;
    let totalReviews = 0;
    let weightedRating = 0;
    const uniqueStudentIds = new Set<string>();

    const courseAnalytics = courses.map(course => {
      const materialCount = course.materials.length;
      const studentCount = course._count.enrollments;
      const reviewCount = course._count.reviews;

      // Track unique students across all courses
      course.enrollments.forEach(enrollment => {
        uniqueStudentIds.add(enrollment.studentId);
      });

      // Calculate completion rate for this course based on progressPercentage
      let completionRate = 0;
      if (studentCount > 0) {
        const totalProgressPercentage = course.enrollments.reduce((sum, enrollment) => {
          return sum + enrollment.progressPercentage;
        }, 0);
        completionRate = totalProgressPercentage / studentCount;
      }

      // Calculate average rating for this course
      let courseRating = 0;
      if (course.reviews.length > 0) {
        const totalRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
        courseRating = totalRating / course.reviews.length;
        weightedRating += totalRating; // Add to overall weighted rating
      }

      totalMaterials += materialCount * studentCount;
      const courseCompletedMaterials = course.enrollments.reduce((sum, enrollment) => {
        return sum + Math.floor((enrollment.progressPercentage / 100) * materialCount);
      }, 0);
      totalCompletedMaterials += courseCompletedMaterials;
      totalEnrollments += studentCount;
      // Since there's no payment system implemented yet, revenue should be 0
      // totalEarnings += studentCount * course.price;
      totalReviews += reviewCount;

      return {
        id: course.id,
        title: course.title,
        students: studentCount,
        revenue: 0, // No payment system implemented yet
        rating: Math.round(courseRating * 10) / 10, // Round to 1 decimal place
        completionRate: Math.round(completionRate * 100) / 100,
        materials: materialCount,
        enrollments: [
          { date: '2024-01', count: Math.floor(studentCount * 0.2) },
          { date: '2024-02', count: Math.floor(studentCount * 0.3) },
          { date: '2024-03', count: Math.floor(studentCount * 0.5) }
        ]
      };
    });

    // Calculate overall completion rate
    const overallCompletionRate = totalMaterials > 0 ? (totalCompletedMaterials / totalMaterials) * 100 : 0;

    // Get unique student count
    const totalStudents = uniqueStudentIds.size;

    // Calculate growth rates (would need historical data for real growth)
    const thisMonthStudents = Math.floor(totalStudents * 0.2);
    const lastMonthStudents = Math.floor(totalStudents * 0.18);
    const thisMonthRevenue = 0; // No payment system implemented yet
    const lastMonthRevenue = 0; // No payment system implemented yet

    const analytics = {
      revenue: {
        total: 0, // No payment system implemented yet
        thisMonth: 0, // No payment system implemented yet
        lastMonth: 0, // No payment system implemented yet
        growth: 0 // No payment system implemented yet
      },
      students: {
        total: totalStudents, // Unique student count
        enrollments: totalEnrollments, // Total enrollments count (can be more than students if they enroll in multiple courses)
        thisMonth: thisMonthStudents,
        lastMonth: lastMonthStudents,
        growth: lastMonthStudents > 0 ? ((thisMonthStudents - lastMonthStudents) / lastMonthStudents) * 100 : 0
      },
      courses: {
        total: courses.length,
        published: courses.filter(c => c.status === CourseStatus.PUBLISHED).length,
        draft: courses.filter(c => c.status === CourseStatus.DRAFT).length,
        archived: courses.filter(c => c.status === CourseStatus.ARCHIVED).length
      },
      engagement: {
        totalEnrollments: totalEnrollments, // Total enrollment count
        avgRating: totalReviews > 0 ? weightedRating / totalReviews : 0,
        totalReviews: totalReviews,
        completionRate: Math.round(overallCompletionRate * 100) / 100
      }
    };

    const revenueData = [
      { date: '2024-01', revenue: 0, students: Math.floor(totalStudents * 0.2) }, // No payment system implemented yet
      { date: '2024-02', revenue: 0, students: Math.floor(totalStudents * 0.3) }, // No payment system implemented yet
      { date: '2024-03', revenue: 0, students: Math.floor(totalStudents * 0.5) } // No payment system implemented yet
    ];

    return res.json({
      success: true,
      data: {
        analytics,
        courseAnalytics,
        revenueData
      }
    });
  } catch (error) {
    console.error('GetTutorAnalytics error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch analytics data' }
    });
  }
};

export const GetCourseCompletion = async (req: AuthRequest, res: express.Response) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.user!.id;

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        creatorId: tutorId
      },
      include: {
        materials: true,
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    const materialCount = course.materials.length;
    const studentProgress = course.enrollments.map(enrollment => {
      const completionRate = enrollment.progressPercentage;
      const completedMaterials = Math.floor((completionRate / 100) * materialCount);

      return {
        studentId: enrollment.studentId,
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        completedMaterials,
        totalMaterials: materialCount,
        completionRate: Math.round(completionRate * 100) / 100
      };
    });

    return res.json({
      success: true,
      data: {
        courseId,
        courseName: course.title,
        totalMaterials: materialCount,
        totalStudents: course.enrollments.length,
        studentProgress
      }
    });
  } catch (error) {
    console.error('GetCourseCompletion error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch course completion data' }
    });
  }
};

// ===== STUDENT ASSIGNMENT CONTROLLERS =====

/**
 * Get assignments for enrolled course (student view)
 */
export const GetStudentCourseAssignments = async (req: AuthRequest, res: express.Response) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user!.id;

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: { message: 'You are not enrolled in this course.' }
      });
    }

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions: {
          where: { studentId },
          select: {
            id: true,
            status: true,
            score: true,
            feedback: true,
            submittedAt: true,
            gradedAt: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    console.error('Get course assignments error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

/**
 * Submit assignment (student)
 */
export const SubmitAssignment = async (req: AuthRequest, res: express.Response) => {
  try {
    const { assignmentId } = req.params;
    const { content, fileUrl } = req.body;
    const studentId = req.user!.id;


    // Verify assignment exists and student is enrolled
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { studentId: studentId }
            }
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Assignment not found.' }
      });
    }

    if (assignment.course.enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        error: { message: 'You are not enrolled in this course.' }
      });
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId
        }
      }
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        error: { message: 'You have already submitted this assignment.' }
      });
    }

    // Check due date
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Assignment due date has passed.' }
      });
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        content: content || '',
        fileUrl: fileUrl || null,
        assignmentId,
        studentId,
        status: 'SUBMITTED'
      },
      include: {
        assignment: {
          select: {
            title: true,
            maxScore: true,
            dueDate: true
          }
        }
      }
    });

    // Update enrollment progress to include this new assignment submission
    // Use centralized progress calculator
    const stats = await recalculateAndUpdateProgress(studentId, assignment.courseId);

    res.status(201).json({
      success: true,
      data: {
        submission,
        progressUpdate: {
          progressPercentage: stats.progressPercentage,
          totalItems: stats.totalItems,
          completedItems: stats.completedItems
        }
      }
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to submit assignment.' }
    });
  }
};

/**
 * Get assignment submission (student view)
 */
export const GetStudentSubmission = async (req: AuthRequest, res: express.Response) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user!.id;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId
        }
      },
      include: {
        assignment: {
          select: {
            title: true,
            description: true,
            maxScore: true,
            dueDate: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { submission }
    });
  } catch (error) {
    console.error('Get assignment submission error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

/**
 * Upload assignment file (student)
 */
export const UploadAssignmentFile = async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No assignment file uploaded' }
      });
    }

    let fileUrl: string | null = null;

    // Check environment: use local storage for development, CDN for production
    if (process.env.NODE_ENV === 'development' || !process.env.BUNNY_API_KEY) {
      // Use local storage for development
      console.log('📂 Using local storage for development');
      fileUrl = await Upload_Files_Local('assignments', req.file);
    } else {
      // Use Bunny CDN for production or when explicitly configured
      console.log('☁️ Using Bunny CDN storage for assignments');
      fileUrl = req.file.size > 20 * 1024 * 1024
        ? await Upload_Files_Stream('assignments', req.file)
        : await Upload_Files('assignments', req.file);
    }

    if (!fileUrl) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to upload assignment file to storage' }
      });
    }

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileUrl: fileUrl
      }
    });
  } catch (error) {
    console.error('Upload assignment file error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to upload assignment file.' }
    });
  }
};

// ===== STUDENT MANAGEMENT CONTROLLERS =====

export const GetStudentsCount = async (req: AuthRequest, res: express.Response) => {
  try {
    const studentsCount = await prisma.student.count();
    return res.status(200).json({
      success: true,
      data: {
        studentsCount
      }
    });
  } catch (error) {
    console.error('Get students count error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get students count.' }
    });
  }
};

export const GetAllRegisteredStudents = async (req: AuthRequest, res: express.Response) => {
  try {
    // Get all students directly from Student table, sorted by registration date (newest first)
    const students = await prisma.student.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map to consistent format
    const formattedStudents = students.map(student => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      avatar: student.avatar,
      registeredAt: student.createdAt.toISOString(),
      lastActive: student.updatedAt.toISOString()
    }));

    return res.status(200).json({
      success: true,
      data: {
        students: formattedStudents
      }
    });
  } catch (error) {
    console.error('Get all registered students error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get registered students.' }
    });
  }
};

export const GetAllStudents = async (req: AuthRequest, res: express.Response) => {
  try {
    const adminId = req.user.id;
    const userRole = req.user.role;

    // Check if user is admin - admins see ALL enrollments, tutors see only their courses
    let courseIds: string[] = [];

    if (userRole === 'Admin') {
      // Admins see all courses - get all course IDs
      const allCourses = await prisma.course.findMany({
        select: { id: true }
      });
      courseIds = allCourses.map(course => course.id);
    } else {
      // Tutors see only their courses
      const tutorCourses = await prisma.course.findMany({
        where: {
          OR: [
            { creatorId: adminId },  // Courses they created
            { tutorId: adminId }     // Courses assigned to them as tutor
          ]
        },
        select: { id: true }
      });
      courseIds = tutorCourses.map(course => course.id);
    }

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: {
          students: [],
          stats: {
            totalStudents: 0,
            activeStudents: 0,
            newThisMonth: 0,
            averageProgress: 0,
            topPerformers: 0,
            totalRevenue: 0
          }
        }
      });
    }

    // Get all students enrolled in the relevant courses with comprehensive data
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: { in: courseIds }
      },
      include: {
        student: true,
        course: {
          include: {
            _count: {
              select: {
                materials: true,
                assignments: true
              }
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            tutor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Group enrollments by student
    const studentMap = new Map();

    enrollments.forEach(enrollment => {
      const studentId = enrollment.student.id;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: enrollment.student.id,
          firstName: enrollment.student.firstName,
          lastName: enrollment.student.lastName,
          email: enrollment.student.email,
          avatar: enrollment.student.avatar,
          joinedAt: enrollment.student.createdAt.toISOString(),
          lastActive: enrollment.student.updatedAt.toISOString(),
          enrollments: [],
          totalCourses: 0,
          completedCourses: 0,
          totalSpentHours: 0,
          totalMaterials: 0,
          completedMaterials: 0,
          totalAssignments: 0,
          submittedAssignments: 0,
          gradedAssignments: 0
        });
      }

      const student = studentMap.get(studentId);
      student.enrollments.push({
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage,
        totalMaterials: enrollment.course._count.materials,
        totalAssignments: enrollment.course._count.assignments,
        completedMaterials: 0, // Will be calculated later
        submittedAssignments: 0, // Will be calculated later
        gradedAssignments: 0, // Will be calculated later
        completedMaterialsList: [], // Will be populated later
        submittedAssignmentsList: [], // Will be populated later
        creator: enrollment.course.creator ? {
          id: enrollment.course.creator.id,
          firstName: enrollment.course.creator.firstName,
          lastName: enrollment.course.creator.lastName,
          email: enrollment.course.creator.email
        } : null,
        tutor: enrollment.course.tutor ? {
          id: enrollment.course.tutor.id,
          firstName: enrollment.course.tutor.firstName,
          lastName: enrollment.course.tutor.lastName,
          email: enrollment.course.tutor.email
        } : null
      });

      student.totalMaterials += enrollment.course._count.materials;
      student.totalAssignments += enrollment.course._count.assignments;
    });

    // Calculate additional statistics for each student
    const students = await Promise.all(Array.from(studentMap.values()).map(async (student) => {
      // Calculate actual time spent from Progress records
      const progressRecords = await prisma.progress.findMany({
        where: {
          studentId: student.id,
          courseId: { in: student.enrollments.map((e: any) => e.courseId) }
        }
      });

      const totalMinutes = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
      student.totalSpentHours = Math.round(totalMinutes / 60); // Convert minutes to hours
      student.totalCourses = student.enrollments.length;
      student.completedCourses = student.enrollments.filter((e: any) => e.status === 'COMPLETED').length;

      // Calculate detailed progress for each enrollment
      for (const enrollment of student.enrollments) {
        // Get completed materials for this specific course
        const completedProgressData = await prisma.progress.findMany({
          where: {
            studentId: student.id,
            courseId: enrollment.courseId,
            isCompleted: true,
            materialId: { not: null }
          },
          orderBy: {
            lastAccessed: 'desc'
          }
        });

        // Get material details for completed materials
        const materialIds = completedProgressData.map(p => p.materialId).filter(Boolean);
        const materials = await prisma.material.findMany({
          where: {
            id: { in: materialIds }
          },
          include: {
            module: {
              select: {
                id: true,
                title: true,
                orderIndex: true
              }
            }
          }
        });

        // Create a map for quick material lookup
        const materialMap = new Map(materials.map(m => [m.id, m]));

        enrollment.completedMaterials = completedProgressData.length;
        enrollment.completedMaterialsList = completedProgressData.map(progress => {
          const material = materialMap.get(progress.materialId!);
          return {
            id: material?.id || '',
            title: material?.title || '',
            type: material?.type || '',
            completedAt: progress.lastAccessed.toISOString(),
            chapter: material?.module ? {
              id: material.module.id,
              title: material.module.title,
              orderIndex: material.module.orderIndex
            } : null
          };
        });

        // Get submitted assignments for this specific course
        const submittedAssignmentsData = await prisma.assignmentSubmission.findMany({
          where: {
            studentId: student.id,
            assignment: {
              courseId: enrollment.courseId
            }
          },
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                maxScore: true
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        });

        enrollment.submittedAssignments = submittedAssignmentsData.length;
        enrollment.gradedAssignments = submittedAssignmentsData.filter(sub => sub.score !== null).length;
        enrollment.submittedAssignmentsList = submittedAssignmentsData.map(submission => ({
          id: submission.id,
          assignmentId: submission.assignment.id,
          title: submission.assignment.title,
          submittedAt: submission.submittedAt.toISOString(),
          status: submission.score !== null ? 'GRADED' : 'SUBMITTED',
          score: submission.score,
          maxScore: submission.assignment.maxScore
        }));
      }

      // Calculate overall totals
      const completedMaterials = await prisma.progress.count({
        where: {
          studentId: student.id,
          courseId: { in: student.enrollments.map((e: any) => e.courseId) },
          isCompleted: true
        }
      });

      const submittedAssignments = await prisma.assignmentSubmission.count({
        where: {
          studentId: student.id,
          assignment: {
            courseId: { in: student.enrollments.map((e: any) => e.courseId) }
          }
        }
      });

      const gradedAssignments = await prisma.assignmentSubmission.count({
        where: {
          studentId: student.id,
          assignment: {
            courseId: { in: student.enrollments.map((e: any) => e.courseId) }
          },
          score: { not: null }
        }
      });

      student.completedMaterials = completedMaterials;
      student.submittedAssignments = submittedAssignments;
      student.gradedAssignments = gradedAssignments;

      return student;
    }));

    // Calculate statistics
    const totalStudents = students.length;
    const activeStudents = students.filter(s =>
      s.enrollments.some((e: any) => e.status === 'ACTIVE')
    ).length;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newThisMonth = students.filter(s =>
      new Date(s.joinedAt) > oneMonthAgo
    ).length;

    const totalProgress = students.reduce((sum, s) =>
      sum + s.enrollments.reduce((enrollmentSum: number, e: any) => enrollmentSum + e.progressPercentage, 0), 0
    );
    const totalEnrollments = students.reduce((sum, s) => sum + s.enrollments.length, 0);
    const averageProgress = totalEnrollments > 0 ? totalProgress / totalEnrollments : 0;

    const topPerformers = students.filter(s =>
      s.enrollments.some((e: any) => e.progressPercentage > 80)
    ).length;

    const stats = {
      totalStudents,
      activeStudents,
      newThisMonth,
      averageProgress: Math.round(averageProgress),
      topPerformers,
      totalRevenue: 0 // No payment system implemented yet
    };

    res.json({
      success: true,
      data: {
        students,
        stats
      }
    });
  } catch (error) {
    console.error('Get all students error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch students.' }
    });
  }
};

// ===== ADMIN AVATAR UPLOAD CONTROLLER =====
export const UploadAdminAvatar = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No avatar file uploaded' }
      });
    }

    // Get current admin to check for existing avatar
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    // Upload new avatar to CDN
    console.log('☁️ Uploading new avatar to CDN');
    const avatarUrl = await Upload_Files('avatars', req.file);

    if (!avatarUrl) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to upload avatar to CDN' }
      });
    }

    // Delete old avatar from CDN if it exists
    if (currentAdmin?.avatar) {
      try {
        console.log('🗑️ Deleting old avatar from CDN:', currentAdmin.avatar);
        const deleted = await Delete_File(currentAdmin.avatar);
        if (deleted) {
          console.log('✅ Successfully deleted old avatar');
        } else {
          console.log('⚠️ Failed to delete old avatar');
        }
      } catch (error) {
        console.error('❌ Error deleting old avatar:', error);
      }
    }

    // Update admin avatar in database
    const updatedAdmin = await prisma.admin.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      data: {
        user: updatedAdmin,
        url: avatarUrl
      },
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to upload avatar' }
    });
  }
};

// ===== COURSE CLEANUP CONTROLLER =====
export const CleanupOrphanedCourses = async (req: AuthRequest, res: express.Response) => {
  try {

    // Find courses that might be orphaned:
    // 1. DRAFT status with no materials and created more than 1 hour ago
    // 2. DRAFT status with no thumbnail and created more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const potentialOrphans = await prisma.course.findMany({
      where: {
        AND: [
          { status: CourseStatus.DRAFT },
          { createdAt: { lt: oneHourAgo } },
          {
            OR: [
              { materials: { none: {} } }, // No materials
              { thumbnail: null }, // No thumbnail
              { thumbnail: "" } // Empty thumbnail
            ]
          }
        ]
      },
      include: {
        materials: true,
        enrollments: true,
        _count: {
          select: {
            materials: true,
            enrollments: true
          }
        }
      }
    });

    const cleanupResults = [];
    let deletedCount = 0;
    let skippedCount = 0;

    for (const course of potentialOrphans) {
      const reason = [];

      if (course._count.materials === 0) {
        reason.push("no materials");
      }

      if (!course.thumbnail) {
        reason.push("no thumbnail");
      }

      if (course._count.enrollments > 0) {
        skippedCount++;
        cleanupResults.push({
          courseId: course.id,
          title: course.title,
          status: 'skipped',
          reason: 'Has enrollments - too dangerous to delete'
        });
        continue;
      }

      const deleted = await safeDeleteCourse(course.id, reason.join(", "));

      if (deleted) {
        deletedCount++;
        cleanupResults.push({
          courseId: course.id,
          title: course.title,
          status: 'deleted',
          reason: reason.join(", ")
        });
      } else {
        skippedCount++;
        cleanupResults.push({
          courseId: course.id,
          title: course.title,
          status: 'failed',
          reason: 'Deletion failed'
        });
      }
    }

    return res.json({
      success: true,
      data: {
        summary: {
          totalFound: potentialOrphans.length,
          deleted: deletedCount,
          skipped: skippedCount
        },
        details: cleanupResults
      },
      message: `Cleanup completed: ${deletedCount} courses deleted, ${skippedCount} skipped`
    });

  } catch (error) {
    console.error('CleanupOrphanedCourses error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error during cleanup' }
    });
  }
};