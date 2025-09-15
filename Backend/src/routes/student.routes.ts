import express from 'express';
import { Router } from 'express';
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, query, validationResult } from 'express-validator';

// Import prisma and middleware
import prisma from '../DB/DB_Config';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// ===== UTILITY FUNCTIONS =====
const generateToken = (studentId: string) => {
  return jwt.sign(
    { id: studentId, type: 'student' },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// ===== STUDENT AUTH ROUTES =====
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

    const existingStudent = await prisma.student.findUnique({
      where: { email }
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: { message: 'Student already exists with this email' }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const student = await prisma.student.create({
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

    const token = generateToken(student.id);

    res.cookie('student_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: { user: student, token }
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

    const student = await prisma.student.findUnique({
      where: { email }
    });

    if (!student || !await bcrypt.compare(password, student.password)) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' }
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is deactivated' }
      });
    }

    const token = generateToken(student.id);

    res.cookie('student_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...studentWithoutPassword } = student;

    res.json({
      success: true,
      data: {
        user: studentWithoutPassword,
        token
      }
    });
  })
);

router.post('/auth/logout', (req: express.Request, res: express.Response) => {
  res.clearCookie('student_token');

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

router.get('/auth/me', asyncHandler(async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.type !== 'student') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type.' }
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        error: { message: 'Student not found.' }
      });
    }

    res.json({
      success: true,
      data: { user: student }
    });
  } catch (error) {
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
    const token = req.cookies.student_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      if (decoded.type !== 'student') {
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

      const student = await prisma.student.update({
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
        data: { user: student }
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token.' }
      });
    }
  })
);

// ===== COURSES ROUTES =====
router.get('/courses',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('level').optional().isString(),
    query('search').optional().isString(),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const category = req.query.category as string;
    const level = req.query.level as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
      isPublic: true
    };

    if (category) {
      where.category = { name: { contains: category, mode: 'insensitive' } };
    }

    if (level) {
      where.level = level;
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

        // Check if user is enrolled (if user is authenticated)
        let isEnrolled = false;
        const token = req.cookies.student_token;
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            if (decoded.type === 'student') {
              const enrollment = await prisma.enrollment.findFirst({
                where: {
                  userId: decoded.id,
                  courseId: course.id,
                  status: 'ACTIVE'
                }
              });
              isEnrolled = !!enrollment;
            }
          } catch (error) {
            // Token invalid or expired, user not enrolled
          }
        }

        return {
          ...course,
          // Keep category as null if not assigned, frontend will handle display
          category: course.category,
          averageRating: avgRating._avg.rating || 0,
          isEnrolled
        };
      })
    );

    res.json({
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
  })
);

router.get('/courses/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  const course = await prisma.course.findUnique({
    where: {
      id,
      status: 'PUBLISHED',
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
      modules: {
        include: {
          materials: {
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              orderIndex: true
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

  res.json({
    success: true,
    data: {
      course: {
        ...course,
        // Keep category as null if not assigned, frontend will handle display
        category: course.category,
        averageRating: avgRating._avg.rating || 0
      }
    }
  });
}));

router.get('/courses/categories/all', asyncHandler(async (req: express.Request, res: express.Response) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          courses: {
            where: {
              status: 'PUBLISHED',
              isPublic: true
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: { categories }
  });
}));

export default router;