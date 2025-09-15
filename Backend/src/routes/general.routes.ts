import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';

// Import prisma and middleware
import prisma from '../DB/DB_Config';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// ===== ADMIN REGISTRATION ROUTE (for creating admin through Postman) =====
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

    // Check if admin already exists with this email
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
        isVerified: true, // Auto-verify admin accounts created through API
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        user: admin
      }
    });
  })
);

export default router;