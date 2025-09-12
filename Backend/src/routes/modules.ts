import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, adminOnly } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.get('/course/:courseId', asyncHandler(async (req: AuthRequest, res: express.Response) => {
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

  res.json({
    success: true,
    data: { modules }
  });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res: express.Response) => {
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

  if (module.course.creatorId !== userId && userRole !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      error: { message: 'Access denied' }
    });
  }

  res.json({
    success: true,
    data: { module }
  });
}));

router.post('/', adminOnly,
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('orderIndex').isInt({ min: 0 }),
    body('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
  ],
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    console.log('Received module creation request body:', req.body);
    console.log('CourseId received for module:', req.body.courseId, 'Type:', typeof req.body.courseId);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Module validation errors:', errors.array());
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

    if (course.creatorId !== userId && userRole !== UserRole.ADMIN) {
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

    res.status(201).json({
      success: true,
      data: { module }
    });
  })
);

router.put('/:id', adminOnly,
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('orderIndex').optional().isInt({ min: 0 }),
  ],
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
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

    if (existingModule.course.creatorId !== userId && userRole !== UserRole.ADMIN) {
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

    res.json({
      success: true,
      data: { module }
    });
  })
);

router.delete('/:id', adminOnly, asyncHandler(async (req: AuthRequest, res: express.Response) => {
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

  if (module.course.creatorId !== userId && userRole !== UserRole.ADMIN) {
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

  res.json({
    success: true,
    message: 'Module deleted successfully'
  });
}));

router.put('/:id/reorder', adminOnly,
  [
    param('id').isUUID(),
    body('newOrderIndex').isInt({ min: 0 }),
  ],
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
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

    if (module.course.creatorId !== userId && userRole !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to reorder this module' }
      });
    }

    const updatedModule = await prisma.courseModule.update({
      where: { id },
      data: { orderIndex: parseInt(newOrderIndex) }
    });

    res.json({
      success: true,
      data: { module: updatedModule }
    });
  })
);

export default router;