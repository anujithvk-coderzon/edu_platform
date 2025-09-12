import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, adminOnly } from '../middleware/auth';
import { MaterialType, UserRole } from '@prisma/client';
import { deleteUploadedFile } from '../utils/fileUtils';

const router = express.Router();

router.get('/course/:courseId', asyncHandler(async (req: AuthRequest, res) => {
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

  // Since only ADMIN role exists, all admins have access
  let isEnrolledOrOwner = true;

  if (!isEnrolledOrOwner) {
    return res.status(403).json({
      success: false,
      error: { message: 'Access denied. You must be enrolled in this course.' }
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

  res.json({
    success: true,
    data: { materials }
  });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

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

  // Since only ADMIN role exists, all admins have access
  let hasAccess = true;

  if (!hasAccess && !material.isPublic) {
    return res.status(403).json({
      success: false,
      error: { message: 'Access denied' }
    });
  }

  await prisma.progress.upsert({
    where: {
      userId_courseId_materialId: {
        userId,
        courseId: material.courseId,
        materialId: material.id
      }
    },
    update: {
      lastAccessed: new Date(),
      timeSpent: { increment: 1 }
    },
    create: {
      userId,
      courseId: material.courseId,
      materialId: material.id,
      lastAccessed: new Date(),
      timeSpent: 1
    }
  });

  res.json({
    success: true,
    data: { material }
  });
}));

router.post('/', adminOnly,
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('type').isIn(['PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'DOCUMENT', 'LINK']),
    body('fileUrl').optional().custom((value) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Accept both full URLs (http/https) and relative paths starting with /
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
  asyncHandler(async (req: AuthRequest, res) => {
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

    if (course.creatorId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
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

    res.status(201).json({
      success: true,
      data: { material }
    });
  })
);

router.put('/:id', adminOnly,
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('type').optional().isIn(['PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'DOCUMENT', 'LINK']),
    body('fileUrl').optional().custom((value) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Accept both full URLs (http/https) and relative paths starting with /
        const urlRegex = /^(https?:\/\/.+|\/[^\/].*)$/;
        if (!urlRegex.test(value)) {
          throw new Error('Invalid URL or path format');
        }
      }
      return true;
    }),
    body('content').optional().isString(),
    body('orderIndex').optional().isInt({ min: 0 }),
    body('moduleId').optional().isLength({ min: 1 }),
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

    if (existingMaterial.course.creatorId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
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

    res.json({
      success: true,
      data: { material }
    });
  })
);

router.delete('/:id', adminOnly, asyncHandler(async (req: AuthRequest, res) => {
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

  if (material.course.creatorId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
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

  res.json({
    success: true,
    message: 'Material and associated file deleted successfully'
  });
}));

router.post('/:id/complete', asyncHandler(async (req: AuthRequest, res) => {
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
      userId_courseId: {
        userId,
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
      userId_courseId_materialId: {
        userId,
        courseId: material.courseId,
        materialId: material.id
      }
    },
    update: {
      isCompleted: true,
      lastAccessed: new Date()
    },
    create: {
      userId,
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
      userId,
      courseId: material.courseId,
      isCompleted: true
    }
  });

  const progressPercentage = Math.round((completedMaterials / totalMaterials) * 100);

  await prisma.enrollment.update({
    where: {
      userId_courseId: {
        userId,
        courseId: material.courseId
      }
    },
    data: {
      progressPercentage,
      ...(progressPercentage === 100 && { completedAt: new Date() })
    }
  });

  res.json({
    success: true,
    data: {
      progressPercentage,
      isCompleted: true
    }
  });
}));

export default router;