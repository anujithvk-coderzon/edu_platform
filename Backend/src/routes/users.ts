import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, adminOnly } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.get('/', adminOnly,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['ADMIN']),
    query('search').optional().isString(),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
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
      prisma.user.findMany({
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
              createdCourses: true,
              enrollments: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
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
  })
);

router.get('/:id', adminOnly, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
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
          enrollments: true,
          submissions: true,
          materials: true,
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

  res.json({
    success: true,
    data: { user }
  });
}));

router.put('/:id', adminOnly,
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('role').optional().isIn(['ADMIN']),
    body('isActive').optional().isBoolean(),
    body('isVerified').optional().isBoolean(),
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
    const { firstName, lastName, role, isActive, isVerified } = req.body;

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (role) updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (typeof isVerified === 'boolean') updates.isVerified = isVerified;

    const user = await prisma.user.update({
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

    res.json({
      success: true,
      data: { user }
    });
  })
);

router.delete('/:id', adminOnly, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  if (id === req.user!.id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Cannot delete your own account' }
    });
  }

  await prisma.user.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

router.get('/stats/overview', adminOnly, asyncHandler(async (req: AuthRequest, res) => {
  const [
    totalUsers,
    totalAdmins,
    totalCourses,
    totalEnrollments,
    recentUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.user.findMany({
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

  res.json({
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
}));

export default router;