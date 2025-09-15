import express from 'express';
import { Router } from 'express';
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, query, param, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Import prisma and middleware
import prisma from '../DB/DB_Config';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, adminOnly } from '../middleware/auth';

// Import types
import { CourseStatus, MaterialType, EnrollmentStatus } from '@prisma/client';

const router = express.Router();

// ===== UTILITY FUNCTIONS =====
const generateToken = (adminId: string) => {
  return jwt.sign(
    { id: adminId, type: 'admin' },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// ===== ADMIN AUTH ROUTES =====
router.post('/auth/bootstrap-admin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const adminExists = await prisma.admin.findFirst();

    if (adminExists) {
      return res.status(400).json({
        success: false,
        error: { message: 'Admin already exists. Use /register endpoint.' }
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

    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    const token = generateToken(admin.id);

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: { user: admin, token }
    });
  })
);

router.post('/auth/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
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

    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    const token = generateToken(admin.id);

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: { user: admin, token }
    });
  })
);

router.post('/auth/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' }
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is deactivated' }
      });
    }

    const token = generateToken(admin.id);

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...adminWithoutPassword } = admin;

    res.json({
      success: true,
      data: {
        user: adminWithoutPassword,
        token
      }
    });
  })
);

router.post('/auth/logout', (req: express.Request, res: express.Response) => {
  res.clearCookie('admin_token');

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

router.get('/auth/me', asyncHandler(async (req: express.Request, res: express.Response) => {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.type && decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type.' }
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: { message: 'Admin not found.' }
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: { message: 'Account is deactivated.' }
      });
    }

    res.json({
      success: true,
      data: { user: admin }
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
}));

router.put('/auth/profile',
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('avatar').optional().isURL(),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const token = req.cookies.admin_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      if (decoded.type !== 'admin') {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid token type.' }
        });
      }

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

      const admin = await prisma.admin.update({
        where: { id: decoded.id },
        data: updates,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          updatedAt: true
        }
      });

      res.json({
        success: true,
        data: { user: admin }
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token.' }
      });
    }
  })
);

router.put('/auth/change-password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const token = req.cookies.admin_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      if (decoded.type !== 'admin') {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid token type.' }
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { currentPassword, newPassword } = req.body;

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id }
      });

      if (!admin || !await bcrypt.compare(currentPassword, admin.password)) {
        return res.status(401).json({
          success: false,
          error: { message: 'Current password is incorrect' }
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.admin.update({
        where: { id: decoded.id },
        data: { password: hashedPassword }
      });

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token.' }
      });
    }
  })
);

// ===== COURSE ENDPOINTS =====
router.get('/courses/my-courses', asyncHandler(async (req: express.Request, res: express.Response) => {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.type && decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type.' }
      });
    }

    // Get courses created by this admin
    const courses = await prisma.course.findMany({
      where: {
        creatorId: decoded.id
      },
      include: {
        enrollments: {
          select: { id: true }
        },
        _count: {
          select: {
            enrollments: true,
            materials: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: {
        courses: courses
      }
    });
  } catch (error) {
    console.error('Get my courses error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
}));

// Categories are no longer needed for course creation

// Create a new course
router.post('/courses',
  [
    body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
    body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
    body('duration').optional().isInt({ min: 1 }),
    body('isPublic').optional().isBoolean(),
    body('tutorName').optional().trim().isLength({ min: 1 }),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const token = req.cookies.admin_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      if (decoded.type && decoded.type !== 'admin') {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid token type.' }
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { title, description, price, level, duration, isPublic, tutorName } = req.body;

      const course = await prisma.course.create({
        data: {
          title,
          description,
          price: parseFloat(price),
          level: level || 'Beginner',
          duration: duration ? parseInt(duration) : null,
          isPublic: isPublic || false,
          tutorName: tutorName || null,
          creatorId: decoded.id,
          // categoryId is null by default (no category requirement)
        },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: {
          course: course
        }
      });
    } catch (error) {
      console.error('Create course error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create course.' }
      });
    }
  })
);

// Get a specific course by ID
router.get('/courses/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.type && decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type.' }
      });
    }

    const course = await prisma.course.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        enrollments: {
          select: { id: true }
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
                orderIndex: true
              },
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        materials: {
          select: { id: true, title: true, type: true }
        },
        _count: {
          select: {
            enrollments: true,
            materials: true
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found.' }
      });
    }

    res.json({
      success: true,
      data: {
        course: course
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch course.' }
    });
  }
}));

// Update a course
router.put('/courses/:id',
  [
    body('title').optional().trim().isLength({ min: 1 }).withMessage('Title is required'),
    body('description').optional().trim().isLength({ min: 1 }).withMessage('Description is required'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
    body('duration').optional().isInt({ min: 1 }),
    body('isPublic').optional().isBoolean(),
    body('tutorName').optional().trim().isLength({ min: 1 }),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const token = req.cookies.admin_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      if (decoded.type && decoded.type !== 'admin') {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid token type.' }
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      // Check if course exists and belongs to this admin
      const existingCourse = await prisma.course.findFirst({
        where: {
          id: req.params.id,
          creatorId: decoded.id
        }
      });

      if (!existingCourse) {
        return res.status(404).json({
          success: false,
          error: { message: 'Course not found or you do not have permission to edit it.' }
        });
      }

      const { title, description, price, level, duration, isPublic, tutorName, status, thumbnail } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (level !== undefined) updateData.level = level;
      if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      if (tutorName !== undefined) updateData.tutorName = tutorName;
      if (status !== undefined) updateData.status = status;
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

      const course = await prisma.course.update({
        where: {
          id: req.params.id
        },
        data: updateData,
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Course updated successfully',
        data: {
          course: course
        }
      });
    } catch (error) {
      console.error('Update course error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to update course.' }
      });
    }
  })
);

// Delete a course
router.delete('/courses/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      materials: {
        select: {
          id: true,
          fileUrl: true,
          type: true
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

  if (course._count.enrollments > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Cannot delete course with active enrollments' }
    });
  }

  // Delete associated files before deleting the course
  const filesToDelete = [];

  // Add course thumbnail to deletion list
  if (course.thumbnail) {
    filesToDelete.push(course.thumbnail);
  }

  // Add all material files to deletion list
  course.materials.forEach(material => {
    if (material.fileUrl && material.type !== 'LINK') {
      filesToDelete.push(material.fileUrl);
    }
  });

  // Delete all files from the server
  let deletedFilesCount = 0;
  filesToDelete.forEach(fileUrl => {
    try {
      // Extract filename from URL (e.g., "/uploads/filename.jpg" -> "filename.jpg")
      const filename = fileUrl.startsWith('/uploads/') ? fileUrl.replace('/uploads/', '') : path.basename(fileUrl);
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const filePath = path.join(uploadDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedFilesCount++;
        console.log(`🗑️ Deleted file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Failed to delete file ${fileUrl}:`, error);
    }
  });

  console.log(`🗑️ Deleted ${deletedFilesCount} files for course: ${course.title}`);

  // Delete the course from database (this will cascade and delete related records)
  await prisma.course.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: `Course and ${deletedFilesCount} associated files deleted successfully`
  });
}));

// Publish a course
router.put('/courses/:id/publish', asyncHandler(async (req: express.Request, res: express.Response) => {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.type && decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type.' }
      });
    }

    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            modules: true,
            materials: true
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

    // Check if the admin owns this course
    if (course.creatorId !== decoded.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to publish this course' }
      });
    }

    if (course.status === 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        error: { message: 'Course is already published' }
      });
    }

    // Optional: Add validation for course readiness
    // if (course._count.materials === 0) {
    //   return res.status(400).json({
    //     success: false,
    //     error: { message: 'Cannot publish course without materials' }
    //   });
    // }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        isPublic: true
      },
      include: {
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
            modules: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        course: updatedCourse,
        message: 'Course published successfully!'
      }
    });
  } catch (error) {
    console.error('Publish course error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to publish course.' }
    });
  }
}));

// ===== MODULES ROUTES =====
router.post('/modules',
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('orderIndex').isInt({ min: 0 }),
    body('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { title, description, orderIndex, courseId } = req.body;

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
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

    res.status(201).json({
      success: true,
      data: { module }
    });
  })
);

// ===== MATERIALS ROUTES =====
router.post('/materials',
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('type').isIn(['PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'DOCUMENT', 'LINK']),
    body('fileUrl').optional().custom((value) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        const urlRegex = /^(https?:\/\/.+|\/[^\/].*)$/;
        if (!urlRegex.test(value)) {
          throw new Error('Invalid URL or path format');
        }
      }
      return true;
    }),
    body('content').optional().isString(),
    body('orderIndex').isInt({ min: 0 }),
    body('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
    body('moduleId').optional().isLength({ min: 1 }),
    body('isPublic').optional().isBoolean(),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
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

    if (type === 'LINK' && !fileUrl) {
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
        authorId: course.creatorId, // Use course creator as author
        isPublic
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
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

    res.status(201).json({
      success: true,
      data: { material }
    });
  })
);

// ===== UPLOAD ROUTES =====
// Set up multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);

    const sanitizedBaseName = baseName
      .replace(/[^a-zA-Z0-9\-_]/g, '_')
      .substring(0, 50);

    cb(null, `${sanitizedBaseName}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4', 'video/mpeg', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'text/plain', 'application/json'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5
  }
});

// Course thumbnail upload
router.post('/uploads/course-thumbnail', upload.single('thumbnail'), asyncHandler(async (req: express.Request, res: express.Response) => {
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

  const thumbnailUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      url: thumbnailUrl,
      fileUrl: thumbnailUrl
    }
  });
}));

// Material file upload
router.post('/uploads/material', upload.single('file'), asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No material file uploaded' }
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
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
}));

export default router;