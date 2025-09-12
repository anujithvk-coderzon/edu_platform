import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, adminOnly } from '../middleware/auth';
import { CourseStatus, UserRole } from '@prisma/client';
import { deleteUploadedFile, deleteMultipleFiles } from '../utils/fileUtils';

const router = express.Router();

router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('level').optional().isString(),
    query('search').optional().isString(),
    query('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
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

router.get('/my-courses', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  // For organization-wise authentication, only show created courses
  const courses = await prisma.course.findMany({
    where: { creatorId: userId },
    include: {
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
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: { courses }
  });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  console.log('Fetching course with ID:', id);

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
          user: {
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
    console.log('Course not found with ID:', id);
    return res.status(404).json({
      success: false,
      error: { message: 'Course not found' }
    });
  }
  
  console.log('Course found:', course.title);

  const avgRating = await prisma.review.aggregate({
    where: { courseId: course.id },
    _avg: { rating: true }
  });

  let isEnrolled = false;
  if (req.user) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user.id,
          courseId: course.id
        }
      }
    });
    isEnrolled = !!enrollment;
  }

  res.json({
    success: true,
    data: {
      course: {
        ...course,
        averageRating: avgRating._avg.rating || 0,
        isEnrolled
      }
    }
  });
}));

router.post('/', authMiddleware, adminOnly,
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').trim().isLength({ min: 10 }),
    body('price').optional().isNumeric(),
    body('duration').optional().isString(),
    body('level').optional().isString(),
    body('categoryId').notEmpty().withMessage('Category is required').isUUID().withMessage('Category must be a valid UUID'),
    body('thumbnail').optional().isURL(),
    body('tutorName').optional().trim().isLength({ min: 1, max: 100 }),
    // Note: objectives, requirements, and tags will be handled separately if needed
    body('objectives').optional().isArray(),
    body('requirements').optional().isArray(),
    body('tags').optional().isArray(),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    console.log('Received course creation request body:', req.body);
    console.log('CategoryId received:', req.body.categoryId, 'Type:', typeof req.body.categoryId);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Detailed validation errors:', errors.array());
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
      objectives = [],
      requirements = [],
      tags = []
    } = req.body;

    // Create the basic course first
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

    res.status(201).json({
      success: true,
      data: { course }
    });
  })
);

router.put('/:id', authMiddleware, adminOnly,
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ min: 10 }),
    body('price').optional().isNumeric(),
    body('duration').optional().isInt({ min: 1 }),
    body('level').optional().isString(),
    body('categoryId').optional().isUUID(),
    body('thumbnail').optional().isURL(),
    body('tutorName').optional().trim().isLength({ min: 1, max: 100 }),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    body('isPublic').optional().isBoolean(),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
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
    if (status) updates.status = status;
    if (typeof isPublic === 'boolean') updates.isPublic = isPublic;

    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      console.log('Course not found for update with ID:', id);
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }
    
    console.log('Course found for update:', existingCourse.title);

    if (existingCourse.creatorId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
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

    res.json({
      success: true,
      data: { course }
    });
  })
);

router.delete('/:id', authMiddleware, adminOnly,
  asyncHandler(async (req: AuthRequest, res) => {
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

    if (course.creatorId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this course' }
      });
    }

    if (course._count.enrollments > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete course with active enrollments' }
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
      deleteUploadedFile(course.thumbnail);
    }

    await prisma.course.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Course and all associated files deleted successfully'
    });
  })
);

router.get('/categories/all', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { courses: true }
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