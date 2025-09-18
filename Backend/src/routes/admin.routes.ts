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
        reviews: {
          select: { rating: true }
        },
        _count: {
          select: {
            enrollments: true,
            materials: true,
            reviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add average rating to each course
    const coursesWithRating = courses.map(course => ({
      ...course,
      averageRating: course.reviews.length > 0 ?
        Math.round((course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length) * 10) / 10 : 0
    }));

    res.json({
      success: true,
      data: {
        courses: coursesWithRating
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
    body('requirements').optional().isArray(),
    body('prerequisites').optional().isArray(),
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

      const { title, description, price, level, duration, isPublic, tutorName, requirements, prerequisites } = req.body;

      const course = await prisma.course.create({
        data: {
          title,
          description,
          price: parseFloat(price),
          level: level || 'Beginner',
          duration: duration ? parseInt(duration) : null,
          isPublic: isPublic || false,
          tutorName: tutorName || null,
          requirements: requirements || [],
          prerequisites: prerequisites || [],
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
        reviews: {
          select: { rating: true }
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
        error: { message: 'Course not found.' }
      });
    }

    // Add average rating to the course
    const courseWithRating = {
      ...course,
      averageRating: course.reviews.length > 0 ?
        Math.round((course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length) * 10) / 10 : 0
    };

    res.json({
      success: true,
      data: {
        course: courseWithRating
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
    body('categoryId').optional().custom((value) => value === null || value === '' || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)),
    body('requirements').optional().isArray().withMessage('Requirements must be an array'),
    body('requirements.*').optional().isString().trim(),
    body('prerequisites').optional().isArray().withMessage('Prerequisites must be an array'),
    body('prerequisites.*').optional().isString().trim(),
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

      const { title, description, price, level, duration, isPublic, tutorName, requirements, prerequisites, status, thumbnail, categoryId } = req.body;

      console.log('Received update request for course:', req.params.id);
      console.log('Requirements:', requirements);
      console.log('Prerequisites:', prerequisites);

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (level !== undefined) updateData.level = level;
      if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      if (tutorName !== undefined) updateData.tutorName = tutorName;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (requirements !== undefined) updateData.requirements = requirements;
      if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
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
      enrollments: {
        select: {
          status: true,
          progressPercentage: true
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

  // Check for active enrollments (not completed)
  const activeEnrollments = course.enrollments.filter(
    enrollment => enrollment.status !== 'COMPLETED' && enrollment.progressPercentage < 100
  );

  if (activeEnrollments.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: `Cannot delete course with ${activeEnrollments.length} active enrollment(s). Wait for students to complete the course or manually mark enrollments as completed.` }
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
    body('type').isIn(['PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'LINK']),
    body('fileUrl').optional().custom((value) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Allow HTTP/HTTPS URLs, local paths, and www URLs
        const urlRegex = /^(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\/][^\s]*)$/;
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
    // Check video file size limit (30MB for videos)
    if (file.mimetype.startsWith('video/')) {
      const maxVideoSize = 30 * 1024 * 1024; // 30MB
      // Note: file.size is not available in fileFilter, size check will be done in multer limits
      cb(null, true);
    } else {
      cb(null, true);
    }
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Custom multer configuration with dynamic file size limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Default 50MB (will be overridden for videos)
    files: 5
  }
});

// Video-specific upload with 25MB limit
const uploadVideo = multer({
  storage,
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('video/')) {
      const allowedVideoMimes = ['video/mp4', 'video/mpeg', 'video/webm'];
      if (allowedVideoMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Video type ${file.mimetype} is not allowed`));
      }
    } else {
      cb(new Error('Only video files are allowed for this endpoint'));
    }
  },
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB for videos
    files: 1
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

// Middleware to check file size based on file type
const checkFileSizeByType = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.file) {
    const isVideo = req.file.mimetype.startsWith('video/');
    const maxSize = isVideo ? 30 * 1024 * 1024 : 50 * 1024 * 1024; // 30MB for videos, 50MB for others

    if (req.file.size > maxSize) {
      const sizeInMB = isVideo ? '30MB' : '50MB';
      const fileTypeText = isVideo ? 'Video' : 'File';
      return res.status(400).json({
        success: false,
        error: { message: `${fileTypeText} size exceeds the ${sizeInMB} limit` }
      });
    }
  }
  next();
};

// Material file upload
router.post('/uploads/material', upload.single('file'), checkFileSizeByType, asyncHandler(async (req: express.Request, res: express.Response) => {
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

// ===== STUDENTS ENDPOINTS =====
// Get all students with their enrollments and progress
router.get('/students', asyncHandler(async (req: express.Request, res: express.Response) => {
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

    // Get admin's courses first
    const adminCourses = await prisma.course.findMany({
      where: { creatorId: decoded.id },
      select: { id: true }
    });

    const courseIds = adminCourses.map(course => course.id);

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

    // Get all students enrolled in admin's courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: { in: courseIds }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            createdAt: true,
            updatedAt: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    // Group enrollments by student
    const studentMap = new Map();

    enrollments.forEach(enrollment => {
      const studentId = enrollment.student.id;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: studentId,
          firstName: enrollment.student.firstName,
          lastName: enrollment.student.lastName,
          email: enrollment.student.email,
          avatar: enrollment.student.avatar,
          joinedAt: enrollment.student.createdAt,
          lastActive: enrollment.student.updatedAt || enrollment.student.createdAt,
          enrollments: []
        });
      }

      studentMap.get(studentId).enrollments.push({
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage
      });
    });

    const students = await Promise.all(Array.from(studentMap.values()).map(async (student) => {
      // Calculate actual time spent from Progress records
      const progressRecords = await prisma.progress.findMany({
        where: {
          userId: student.id,
          courseId: { in: student.enrollments.map((e: any) => e.courseId) }
        }
      });

      const totalTimeSpent = progressRecords.reduce((total, record) => total + (record.timeSpent || 0), 0);

      // Get course durations for estimation if no actual time is recorded
      const courses = await prisma.course.findMany({
        where: { id: { in: student.enrollments.map((e: any) => e.courseId) } },
        select: { id: true, duration: true }
      });

      // Calculate estimated time based on progress if no actual time recorded
      let estimatedTimeSpent = 0;
      if (totalTimeSpent === 0) {
        student.enrollments.forEach((enrollment: any) => {
          const course = courses.find(c => c.id === enrollment.courseId);
          if (course && course.duration && enrollment.progressPercentage > 0) {
            const courseDurationMinutes = course.duration * 60;
            estimatedTimeSpent += Math.floor((enrollment.progressPercentage / 100) * courseDurationMinutes);
          }
        });
      }

      return {
        ...student,
        totalCourses: student.enrollments.length,
        completedCourses: student.enrollments.filter((e: any) => e.status === 'COMPLETED' || e.progressPercentage >= 100).length,
        totalSpentHours: Math.round((totalTimeSpent > 0 ? totalTimeSpent : estimatedTimeSpent) / 60) // Convert minutes to hours
      };
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

    // Since there's no payment system implemented yet, set revenue to 0
    // TODO: Implement payment tracking with a Payment model that includes:
    // - paymentId, enrollmentId, amount, status (pending/completed/failed), paymentDate
    // Then calculate: SELECT SUM(amount) FROM payments WHERE status='completed' AND enrollmentId IN (...)
    const totalRevenue = 0;

    const stats = {
      totalStudents,
      activeStudents,
      newThisMonth,
      averageProgress,
      topPerformers,
      totalRevenue
    };

    res.json({
      success: true,
      data: {
        students,
        stats
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
}));

// Get specific student details
router.get('/students/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
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

    // Get admin's courses first
    const adminCourses = await prisma.course.findMany({
      where: { creatorId: decoded.id },
      select: { id: true }
    });

    const courseIds = adminCourses.map(course => course.id);

    // Get student with their enrollments in admin's courses
    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        enrollments: {
          where: {
            courseId: { in: courseIds }
          },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                price: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: { message: 'Student not found' }
      });
    }

    if (student.enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        error: { message: 'Student is not enrolled in any of your courses' }
      });
    }

    // Calculate actual time spent from Progress records
    const progressRecords = await prisma.progress.findMany({
      where: {
        userId: student.id,
        courseId: { in: student.enrollments.map(e => e.courseId) }
      }
    });

    const totalTimeSpent = progressRecords.reduce((total, record) => total + (record.timeSpent || 0), 0);

    // Get course durations for estimation if no actual time is recorded
    const courses = await prisma.course.findMany({
      where: { id: { in: student.enrollments.map(e => e.courseId) } },
      select: { id: true, duration: true }
    });

    // Calculate estimated time based on progress if no actual time recorded
    let estimatedTimeSpent = 0;
    if (totalTimeSpent === 0) {
      student.enrollments.forEach(enrollment => {
        const course = courses.find(c => c.id === enrollment.courseId);
        if (course && course.duration && enrollment.progressPercentage > 0) {
          const courseDurationMinutes = course.duration * 60;
          estimatedTimeSpent += Math.floor((enrollment.progressPercentage / 100) * courseDurationMinutes);
        }
      });
    }

    const studentData = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      avatar: student.avatar,
      joinedAt: student.createdAt,
      lastActive: student.updatedAt || student.createdAt,
      totalCourses: student.enrollments.length,
      completedCourses: student.enrollments.filter(e => e.status === 'COMPLETED' || e.progressPercentage >= 100).length,
      totalSpentHours: Math.round((totalTimeSpent > 0 ? totalTimeSpent : estimatedTimeSpent) / 60), // Convert minutes to hours
      enrollments: student.enrollments.map(enrollment => ({
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage
      }))
    };

    res.json({
      success: true,
      data: { student: studentData }
    });
  } catch (error) {
    console.error('Get student error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
}));

// Get student email for messaging
router.get('/students/:id/email', asyncHandler(async (req: express.Request, res: express.Response) => {
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

    // Get admin's courses first to verify student access
    const adminCourses = await prisma.course.findMany({
      where: { creatorId: decoded.id },
      select: { id: true }
    });

    const courseIds = adminCourses.map(course => course.id);

    // Get student and verify they are enrolled in admin's courses
    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        enrollments: {
          where: {
            courseId: { in: courseIds }
          },
          select: { id: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: { message: 'Student not found' }
      });
    }

    if (student.enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        error: { message: 'Student is not enrolled in any of your courses' }
      });
    }

    res.json({
      success: true,
      data: {
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        mailtoLink: `mailto:${student.email}?subject=Message from Your Course Instructor&body=Hello ${student.firstName},%0D%0A%0D%0A`
      }
    });
  } catch (error) {
    console.error('Get student email error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
}));

// ===== ANALYTICS ENDPOINTS =====
// Get tutor analytics
router.get('/analytics/tutor', asyncHandler(async (req: express.Request, res: express.Response) => {
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

    const tutorId = decoded.id;

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
        reviews: {
          select: {
            rating: true
          }
        },
        enrollments: {
          include: {
            progressRecords: {
              where: {
                isCompleted: true
              }
            }
          }
        }
      }
    });

    // Calculate completion rates based on actual progress data
    let totalMaterials = 0;
    let totalCompletedMaterials = 0;
    let totalStudents = 0;
    let totalReviews = 0;
    let weightedRating = 0;

    const courseAnalytics = courses.map(course => {
      const materialCount = course.materials.length;
      const studentCount = course._count.enrollments;

      // Calculate completion rate for this course
      let completionRate = 0;
      if (materialCount > 0 && studentCount > 0) {
        const totalPossibleCompletions = materialCount * studentCount;
        const actualCompletions = course.enrollments.reduce((sum, enrollment) => {
          return sum + enrollment.progressRecords.length;
        }, 0);
        completionRate = totalPossibleCompletions > 0 ? (actualCompletions / totalPossibleCompletions) * 100 : 0;
      }

      totalMaterials += materialCount * studentCount;
      totalCompletedMaterials += course.enrollments.reduce((sum, enrollment) => sum + enrollment.progressRecords.length, 0);
      totalStudents += studentCount;

      // Add to overall rating calculation
      if (course.reviews.length > 0) {
        const courseRating = course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length;
        weightedRating += courseRating * course.reviews.length;
        totalReviews += course.reviews.length;
      }

      return {
        id: course.id,
        title: course.title,
        students: studentCount,
        revenue: 0, // No payment system implemented yet
        rating: course.reviews.length > 0 ?
          Math.round((course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length) * 10) / 10 : 0,
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
        published: courses.filter(c => c.status === 'PUBLISHED').length,
        draft: courses.filter(c => c.status === 'DRAFT').length,
        archived: courses.filter(c => c.status === 'ARCHIVED').length
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

    res.json({
      success: true,
      data: {
        analytics,
        courseAnalytics,
        revenueData
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch analytics data' }
    });
  }
}));

// Get course completion analytics
router.get('/analytics/course/:courseId/completion', asyncHandler(async (req: express.Request, res: express.Response) => {
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

    const { courseId } = req.params;
    const tutorId = decoded.id;

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
                firstName: true,
                lastName: true
              }
            },
            progressRecords: {
              where: {
                isCompleted: true
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
      const completedMaterials = enrollment.progressRecords.length;
      const completionRate = materialCount > 0 ? (completedMaterials / materialCount) * 100 : 0;

      return {
        studentId: enrollment.userId,
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        completedMaterials,
        totalMaterials: materialCount,
        completionRate: Math.round(completionRate * 100) / 100
      };
    });

    res.json({
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
    console.error('Course completion error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch course completion data' }
    });
  }
}));

// ===== MODULE ENDPOINTS =====
// Delete a module and all its materials
router.delete('/modules/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
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

    const module = await prisma.courseModule.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            creatorId: true
          }
        },
        materials: {
          select: {
            id: true,
            fileUrl: true,
            type: true
          }
        }
      }
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: { message: 'Module not found' }
      });
    }

    if (module.course.creatorId !== decoded.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this module' }
      });
    }

    // Delete all material files from server
    let deletedFilesCount = 0;
    module.materials.forEach(material => {
      if (material.fileUrl && material.type !== 'LINK') {
        try {
          // Extract filename from URL (e.g., "/uploads/filename.jpg" -> "filename.jpg")
          const filename = material.fileUrl.startsWith('/uploads/') ? material.fileUrl.replace('/uploads/', '') : path.basename(material.fileUrl);
          const uploadDir = process.env.UPLOAD_DIR || './uploads';
          const filePath = path.join(uploadDir, filename);

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedFilesCount++;
            console.log(`🗑️ Deleted material file: ${filePath}`);
          }
        } catch (error) {
          console.error(`Failed to delete material file ${material.fileUrl}:`, error);
        }
      }
    });

    // Delete the module from database (this will cascade delete all materials)
    await prisma.courseModule.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `Module and ${module.materials.length} materials (${deletedFilesCount} files) deleted successfully`
    });
  } catch (error) {
    console.error('Delete module error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
}));

// ===== MATERIAL ENDPOINTS =====
// Delete a material
router.delete('/materials/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
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

    if (material.course.creatorId !== decoded.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this material' }
      });
    }

    // Delete the physical file if it exists
    if (material.fileUrl && material.type !== 'LINK') {
      try {
        // Extract filename from URL (e.g., "/uploads/filename.jpg" -> "filename.jpg")
        const filename = material.fileUrl.startsWith('/uploads/') ? material.fileUrl.replace('/uploads/', '') : path.basename(material.fileUrl);
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const filePath = path.join(uploadDir, filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted material file: ${filePath}`);
        }
      } catch (error) {
        console.error(`Failed to delete material file ${material.fileUrl}:`, error);
      }
    }

    const courseId = material.courseId;

    // Delete the material from database
    await prisma.material.delete({
      where: { id }
    });

    // Delete progress records for this deleted material
    await prisma.progress.deleteMany({
      where: { materialId: id }
    });

    // Recalculate progress for all enrollments in this course
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId }
    });

    for (const enrollment of enrollments) {
      // Get current materials for the course
      const currentMaterials = await prisma.material.findMany({
        where: { courseId },
        select: { id: true }
      });

      // Get completed materials for this student
      const completedMaterials = await prisma.progress.findMany({
        where: {
          userId: enrollment.userId,
          courseId,
          isCompleted: true
        }
      });

      const totalMaterials = currentMaterials.length;
      const completedCount = completedMaterials.length;

      const progressPercentage = totalMaterials > 0
        ? Math.min(100, Math.round((completedCount / totalMaterials) * 100))
        : 0;

      // Update enrollment progress
      await prisma.enrollment.update({
        where: {
          userId_courseId: {
            userId: enrollment.userId,
            courseId
          }
        },
        data: {
          progressPercentage,
          ...(progressPercentage === 100 && { completedAt: new Date(), status: 'COMPLETED' })
        }
      });
    }

    res.json({
      success: true,
      message: 'Material deleted and progress recalculated for all students'
    });
  } catch (error) {
    console.error('Delete material error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
}));

// ===== ASSIGNMENT ENDPOINTS =====
// Create a new assignment
router.post('/assignments',
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
    body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
    body('maxScore').optional().isFloat({ min: 0 }).withMessage('Max score must be a positive number'),
    body('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
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

      const { title, description, dueDate, maxScore, courseId } = req.body;

      // Verify course ownership
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          creatorId: decoded.id
        }
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          error: { message: 'Course not found or you do not have permission to add assignments to it.' }
        });
      }

      const assignment = await prisma.assignment.create({
        data: {
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : null,
          maxScore: maxScore || 100,
          courseId,
          creatorId: decoded.id
        },
        include: {
          course: {
            select: {
              id: true,
              title: true
            }
          },
          creator: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: { assignment }
      });
    } catch (error) {
      console.error('Create assignment error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create assignment.' }
      });
    }
  })
);

// Get assignments for a course
router.get('/assignments/course/:courseId', asyncHandler(async (req: express.Request, res: express.Response) => {
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

    const { courseId } = req.params;

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        creatorId: decoded.id
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found or you do not have permission to view its assignments.' }
      });
    }

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            submissions: true
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
}));

// Get assignment submissions
router.get('/assignments/:assignmentId/submissions', asyncHandler(async (req: express.Request, res: express.Response) => {
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

    const { assignmentId } = req.params;

    // Verify assignment ownership
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        creatorId: decoded.id
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Assignment not found or you do not have permission to view its submissions.' }
      });
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignment: {
          select: {
            title: true,
            maxScore: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Debug logging to check fileUrl values
    console.log('📋 Fetched submissions for assignment:', assignmentId);
    submissions.forEach((sub, index) => {
      console.log(`  Submission ${index + 1}:`, {
        id: sub.id,
        studentName: sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : 'Unknown',
        hasContent: !!sub.content && sub.content.trim() !== '',
        contentLength: sub.content ? sub.content.length : 0,
        fileUrl: sub.fileUrl,
        hasFileUrl: !!sub.fileUrl && sub.fileUrl.trim() !== '',
        status: sub.status,
        score: sub.score
      });
    });

    res.json({
      success: true,
      data: { submissions }
    });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
}));

// Grade assignment submission
router.put('/assignments/submissions/:submissionId/grade',
  [
    body('score').isFloat({ min: 0 }).withMessage('Score must be a positive number'),
    body('feedback').optional().trim(),
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

      const { submissionId } = req.params;
      const { score, feedback } = req.body;

      // Verify submission ownership through assignment
      const submission = await prisma.assignmentSubmission.findFirst({
        where: { id: submissionId },
        include: {
          assignment: {
            select: {
              creatorId: true,
              maxScore: true
            }
          }
        }
      });

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: { message: 'Submission not found.' }
        });
      }

      if (submission.assignment.creatorId !== decoded.id) {
        return res.status(403).json({
          success: false,
          error: { message: 'Not authorized to grade this submission.' }
        });
      }

      if (score > submission.assignment.maxScore) {
        return res.status(400).json({
          success: false,
          error: { message: `Score cannot exceed maximum score of ${submission.assignment.maxScore}` }
        });
      }

      const gradedSubmission = await prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          score,
          feedback: feedback || null,
          status: 'GRADED',
          gradedAt: new Date()
        },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignment: {
            select: {
              title: true,
              maxScore: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: { submission: gradedSubmission }
      });
    } catch (error) {
      console.error('Grade submission error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to grade submission.' }
      });
    }
  })
);

// Delete assignment
router.delete('/assignments/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
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

    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        creatorId: decoded.id
      },
      include: {
        submissions: {
          select: {
            fileUrl: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Assignment not found or you do not have permission to delete it.' }
      });
    }

    // Delete submission files
    let deletedFilesCount = 0;
    assignment.submissions.forEach(submission => {
      if (submission.fileUrl) {
        try {
          const filename = submission.fileUrl.startsWith('/uploads/')
            ? submission.fileUrl.replace('/uploads/', '')
            : path.basename(submission.fileUrl);
          const uploadDir = process.env.UPLOAD_DIR || './uploads';
          const filePath = path.join(uploadDir, filename);

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedFilesCount++;
            console.log(`🗑️ Deleted submission file: ${filePath}`);
          }
        } catch (error) {
          console.error(`Failed to delete submission file ${submission.fileUrl}:`, error);
        }
      }
    });

    await prisma.assignment.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `Assignment and ${assignment.submissions.length} submissions (${deletedFilesCount} files) deleted successfully`
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
}));

export default router;