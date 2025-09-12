import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth';

const router = express.Router();

router.get('/', asyncHandler(async (req: express.Request, res: express.Response) => {
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

router.get('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
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

  res.json({
    success: true,
    data: { category }
  });
}));

router.post('/', authMiddleware, adminOnly,
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
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

    res.status(201).json({
      success: true,
      data: { category }
    });
  })
);

router.put('/:id', authMiddleware, adminOnly,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
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

    res.json({
      success: true,
      data: { category }
    });
  })
);

router.delete('/:id', authMiddleware, adminOnly, asyncHandler(async (req: AuthRequest, res: express.Response) => {
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

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
}));

export default router;