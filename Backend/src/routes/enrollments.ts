import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { EnrollmentStatus, UserRole } from '@prisma/client';

const router = express.Router();

router.post('/enroll',
  [
    body('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
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

    if (!course.isPublic || course.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        error: { message: 'Course is not available for enrollment' }
      });
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
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
        userId,
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

    res.status(201).json({
      success: true,
      data: { enrollment }
    });
  })
);

router.get('/my-enrollments', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
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
          userId,
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

  res.json({
    success: true,
    data: { enrollments: enrollmentsWithProgress }
  });
}));

router.get('/course/:courseId/students', asyncHandler(async (req: AuthRequest, res) => {
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

  if (course.creatorId !== userId && userRole !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      error: { message: 'Not authorized to view course students' }
    });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
      user: {
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
          userId: enrollment.userId,
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

  res.json({
    success: true,
    data: { students: studentsWithProgress }
  });
}));

router.put('/:enrollmentId/status',
  [
    param('enrollmentId').isUUID(),
    body('status').isIn(['ACTIVE', 'COMPLETED', 'DROPPED']),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
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

    const canModify = enrollment.userId === userId || 
                     enrollment.course.creatorId === userId ||
                     req.user!.role === UserRole.ADMIN;

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
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { enrollment: updatedEnrollment }
    });
  })
);

router.get('/progress/:courseId', asyncHandler(async (req: AuthRequest, res) => {
  const { courseId } = req.params;
  const userId = req.user!.id;

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
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
        userId,
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

  res.json({
    success: true,
    data: {
      enrollment,
      materials: materialsWithProgress,
      stats: {
        totalMaterials,
        completedMaterials,
        progressPercentage: totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0,
        totalTimeSpent
      }
    }
  });
}));

router.delete('/:enrollmentId', asyncHandler(async (req: AuthRequest, res) => {
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

  const canDelete = enrollment.userId === userId ||
                   enrollment.course.creatorId === userId ||
                   req.user!.role === UserRole.ADMIN;

  if (!canDelete) {
    return res.status(403).json({
      success: false,
      error: { message: 'Not authorized to delete this enrollment' }
    });
  }

  await prisma.enrollment.delete({
    where: { id: enrollmentId }
  });

  res.json({
    success: true,
    message: 'Enrollment cancelled successfully'
  });
}));

export default router;