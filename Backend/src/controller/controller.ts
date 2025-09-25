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

// Define user role type since we're using string roles
type UserRole = "admin" | "tutor";

// Import utilities
import { deleteUploadedFile, deleteMultipleFiles } from '../utils/fileUtils';
import { generateOTP, StoreForgetOtp, VerifyForgetOtp, ForgetPasswordMail, ClearForgetOtp } from '../utils/EmailVerification';

// ===== UTILITY FUNCTIONS =====
const GenerateToken = (userId: string) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// ===== AUTH CONTROLLERS =====
export const BootstrapAdmin = async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const adminExists = await prisma.admin.findFirst();

    if (adminExists) {
      return res.status(400).json({
        success: false,
        error: { message: 'Admin already exists. Use /register endpoint.' }
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
        role: "admin",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    const token = GenerateToken(user.id);

    // Set role-specific cookie names (BootstrapAdmin always creates ADMIN)
    const cookieName = 'admin_token';

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
        createdAt: true
      }
    });

    const token = GenerateToken(user.id);

    // Set role-specific cookie names (RegisterUser creates ADMIN by default)
    const cookieName = 'admin_token';

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      data: { user, token }
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
    if (req.user!.type !== "admin" || req.user!.role !== "admin") {
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
        role: "tutor",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      success: true,
      data: { tutor },
      message: 'Tutor registered successfully'
    });
  } catch (error) {
    console.error('RegisterTutor error:', error);
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

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
            announcements: true
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
      prisma.admin.count({ where: { role: "admin" } }),
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

    if (userRole === "admin") {
      // Admin can see all courses
      whereClause = {};
    } else if (userRole === "tutor") {
      // Tutor can see courses they created or are assigned to
      whereClause = {
        OR: [
          { creatorId: userId },
          { tutorId: userId }
        ]
      };
    } else {
      // Students see only courses they created (if any)
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
    if (req.user!.type !== "admin" || req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const tutors = await prisma.admin.findMany({
      where: { role: "tutor" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            createdCourses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: { tutors }
    });
  } catch (error) {
    console.error('GetAllTutors error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

export const GetCourseById = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;

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

    // If tutorId is provided, verify it's a valid tutor
    if (tutorId) {
      const tutor = await prisma.admin.findUnique({
        where: { id: tutorId }
      });

      if (!tutor || tutor.role !== "tutor") {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid tutor ID' }
        });
      }
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        duration: duration ? parseInt(duration) : null,
        level,
        categoryId,
        thumbnail,
        tutorName: tutorName || `${req.user!.firstName} ${req.user!.lastName}`,
        creatorId: req.user!.id,
        status: CourseStatus.DRAFT
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
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
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

    // If tutorId is provided, verify it's a valid tutor
    if (tutorId) {
      const tutor = await prisma.admin.findUnique({
        where: { id: tutorId }
      });

      if (!tutor || tutor.role !== "tutor") {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid tutor ID' }
        });
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

    if (existingCourse.creatorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to update this course' }
      });
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

export const PublishCourse = async (req: AuthRequest, res: express.Response) => {
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

    if (course.creatorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to publish this course' }
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
        isPublic: true
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

    return res.json({
      success: true,
      data: { 
        course: updatedCourse,
        message: 'Course published successfully!'
      }
    });
  } catch (error) {
    console.error('PublishCourse error:', error);
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
        materials: {
          select: {
            id: true,
            fileUrl: true,
            type: true
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

    if (course.creatorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this course' }
      });
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

    // Delete all associated material files
    const materialFileUrls = course.materials
      .filter(material => material.fileUrl && material.type !== 'LINK')
      .map(material => material.fileUrl!);
    
    const deletedFilesCount = deleteMultipleFiles(materialFileUrls);
    console.log(`🗑️ Deleted ${deletedFilesCount} material files for course: ${course.title}`);

    // Delete course thumbnail if it exists
    if (course.thumbnail) {
      const thumbnailDeleted = deleteUploadedFile(course.thumbnail);
      console.log(`🖼️ Course thumbnail deletion: ${thumbnailDeleted ? 'SUCCESS' : 'FAILED'} - ${course.thumbnail}`);
    } else {
      console.log(`📝 No thumbnail to delete for course: ${course.title}`);
    }

    await prisma.course.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Course and all associated files deleted successfully'
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

    if (course.creatorId !== userId && userRole !== "admin") {
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

    if (module.course.creatorId !== userId && userRole !== "admin") {
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

    if (course.creatorId !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to add modules to this course' }
      });
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
          select: { creatorId: true }
        }
      }
    });

    if (!existingModule) {
      return res.status(404).json({
        success: false,
        error: { message: 'Module not found' }
      });
    }

    if (existingModule.course.creatorId !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to update this module' }
      });
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
          select: { creatorId: true }
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

    if (module.course.creatorId !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this module' }
      });
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

    if (module.course.creatorId !== userId && userRole !== "admin") {
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

    if (course.creatorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to add materials to this course' }
      });
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
            creatorId: true
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

    if (existingMaterial.course.creatorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to update this material' }
      });
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
            creatorId: true
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

    if (material.course.creatorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this material' }
      });
    }

    // Delete the physical file if it exists
    if (material.fileUrl && material.type !== 'LINK') {
      deleteUploadedFile(material.fileUrl);
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
            creatorId: true
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

    const totalMaterials = await prisma.material.count({
      where: { courseId: material.courseId }
    });

    const completedMaterials = await prisma.progress.count({
      where: {
        studentId: userId,
        courseId: material.courseId,
        isCompleted: true
      }
    });

    const progressPercentage = totalMaterials > 0
      ? Math.min(100, Math.round((completedMaterials / totalMaterials) * 100))
      : 0;

    await prisma.enrollment.update({
      where: {
        studentId_courseId: {
          studentId: userId,
          courseId: material.courseId
        }
      },
      data: {
        progressPercentage,
        ...(progressPercentage === 100 && { completedAt: new Date() })
      }
    });

    return res.json({
      success: true,
      data: {
        progressPercentage,
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

    if (course.creatorId !== userId && userRole !== "admin") {
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
            creatorId: true
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
                     req.user!.role === "admin";

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

    const totalMaterials = materials.length;
    const completedMaterials = progressRecords.filter(p => p.isCompleted).length;
    const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);

    return res.json({
      success: true,
      data: {
        enrollment,
        materials: materialsWithProgress,
        stats: {
          totalMaterials,
          completedMaterials,
          progressPercentage: totalMaterials > 0 ? Math.min(100, Math.round((completedMaterials / totalMaterials) * 100)) : 0,
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
                     req.user!.role === "admin";

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

      if (course.creatorId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to update this course' }
        });
      }

      const thumbnailUrl = `/uploads/${req.file.filename}`;

      // Get current course to check for existing thumbnail
      const currentCourse = await prisma.course.findUnique({
        where: { id: courseId },
        select: { thumbnail: true }
      });

      // Delete old thumbnail if it exists
      if (currentCourse?.thumbnail) {
        deleteUploadedFile(currentCourse.thumbnail);
      }

      await prisma.course.update({
        where: { id: courseId },
        data: { thumbnail: thumbnailUrl }
      });

      return res.json({
        success: true,
        data: {
          filename: req.file.filename,
          url: thumbnailUrl,
          message: 'Course thumbnail updated successfully'
        }
      });
    } else {
      const thumbnailUrl = `/uploads/${req.file.filename}`;
      
      return res.json({
        success: true,
        data: {
          filename: req.file.filename,
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
    
    // Store URL directly in uploads directory
    const fileUrl = `/uploads/${req.file.filename}`;

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

      if (course.creatorId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to upload materials for this course' }
        });
      }
    }

    return res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileUrl: fileUrl,
        url: fileUrl,
        path: req.file.path
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
    const tutorId = req.user!.id;
    
    // Get tutor's courses with enrollment counts
    const courses = await prisma.course.findMany({
      where: {
        creatorId: tutorId
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            materials: true,
            reviews: true
          }
        },
        materials: true,
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
    let totalStudents = 0;
    let totalEarnings = 0;
    let totalReviews = 0;
    let weightedRating = 0;

    const courseAnalytics = courses.map(course => {
      const materialCount = course.materials.length;
      const studentCount = course._count.enrollments;
      const reviewCount = course._count.reviews;
      
      // Calculate completion rate for this course based on progressPercentage
      let completionRate = 0;
      if (studentCount > 0) {
        const totalProgressPercentage = course.enrollments.reduce((sum, enrollment) => {
          return sum + enrollment.progressPercentage;
        }, 0);
        completionRate = totalProgressPercentage / studentCount;
      }

      totalMaterials += materialCount * studentCount;
      const courseCompletedMaterials = course.enrollments.reduce((sum, enrollment) => {
        return sum + Math.floor((enrollment.progressPercentage / 100) * materialCount);
      }, 0);
      totalCompletedMaterials += courseCompletedMaterials;
      totalStudents += studentCount;
      // Since there's no payment system implemented yet, revenue should be 0
      // totalEarnings += studentCount * course.price;
      totalReviews += reviewCount;

      return {
        id: course.id,
        title: course.title,
        students: studentCount,
        revenue: 0, // No payment system implemented yet
        rating: 0, // Would need to calculate from reviews
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
        total: totalStudents,
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
        totalViews: totalStudents * 2, // Estimate based on student engagement
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