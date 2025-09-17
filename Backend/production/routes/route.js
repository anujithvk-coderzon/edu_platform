"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Import prisma and middleware
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
// Import types
const client_1 = require("@prisma/client");
// Import utilities
const fileUtils_1 = require("../utils/fileUtils");
const router = express_1.default.Router();
// ===== UTILITY FUNCTIONS =====
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
// ===== MULTER CONFIGURATION FOR UPLOADS =====
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        const baseName = path_1.default.basename(file.originalname, extension);
        const sanitizedBaseName = baseName
            .replace(/[^a-zA-Z0-9\-_]/g, '_')
            .substring(0, 50);
        cb(null, `${sanitizedBaseName}-${uniqueSuffix}${extension}`);
    }
});
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 5
    }
});
// ===== AUTH ROUTES =====
router.post('/auth/bootstrap-admin', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const adminExists = await DB_Config_1.default.user.findFirst({
        where: { role: UserRole.ADMIN }
    });
    if (adminExists) {
        return res.status(400).json({
            success: false,
            error: { message: 'Admin already exists. Use /register endpoint.' }
        });
    }
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, password, firstName, lastName } = req.body;
    const existingUser = await DB_Config_1.default.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            error: { message: 'User already exists with this email' }
        });
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const user = await DB_Config_1.default.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: UserRole.ADMIN,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true
        }
    });
    const token = generateToken(user.id);
    // Set role-specific cookie names (bootstrap-admin always creates ADMIN)
    const cookieName = 'admin_token';
    res.cookie(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(201).json({
        success: true,
        data: { user, token }
    });
}));
router.post('/auth/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, password, firstName, lastName, role = 'STUDENT' } = req.body;
    const existingUser = await DB_Config_1.default.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            error: { message: 'User already exists with this email' }
        });
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const user = await DB_Config_1.default.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: role,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true
        }
    });
    const token = generateToken(user.id);
    // Set role-specific cookie names based on actual user role
    const cookieName = user.role === 'ADMIN' ? 'admin_token' : 'student_token';
    res.cookie(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(201).json({
        success: true,
        data: { user, token }
    });
}));
// Single Login Endpoint with Role-Specific Cookies
router.post('/auth/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, password } = req.body;
    const user = await DB_Config_1.default.user.findUnique({
        where: { email }
    });
    if (!user || !await bcryptjs_1.default.compare(password, user.password)) {
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid email or password' }
        });
    }
    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            error: { message: 'Account is deactivated' }
        });
    }
    const token = generateToken(user.id);
    // Set role-specific cookie names
    const cookieName = user.role === 'ADMIN' ? 'admin_token' : 'student_token';
    res.cookie(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const { password: _, ...userWithoutPassword } = user;
    res.json({
        success: true,
        data: {
            user: userWithoutPassword,
            token
        }
    });
}));
router.post('/auth/logout', auth_1.authMiddleware, (req, res) => {
    // Only clear the cookie for the current user's role
    const cookieName = req.user.role === 'ADMIN' ? 'admin_token' : 'student_token';
    res.clearCookie(cookieName);
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
router.get('/auth/me', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await DB_Config_1.default.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true
        }
    });
    res.json({
        success: true,
        data: { user }
    });
}));
router.put('/auth/profile', auth_1.authMiddleware, [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('avatar').optional().isURL(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const updates = {};
    const { firstName, lastName, avatar } = req.body;
    if (firstName)
        updates.firstName = firstName;
    if (lastName)
        updates.lastName = lastName;
    if (avatar)
        updates.avatar = avatar;
    const user = await DB_Config_1.default.user.update({
        where: { id: req.user.id },
        data: updates,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            updatedAt: true
        }
    });
    res.json({
        success: true,
        data: { user }
    });
}));
router.put('/auth/change-password', auth_1.authMiddleware, [
    (0, express_validator_1.body)('currentPassword').notEmpty(),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { currentPassword, newPassword } = req.body;
    const user = await DB_Config_1.default.user.findUnique({
        where: { id: req.user.id }
    });
    if (!user || !await bcryptjs_1.default.compare(currentPassword, user.password)) {
        return res.status(401).json({
            success: false,
            error: { message: 'Current password is incorrect' }
        });
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
    await DB_Config_1.default.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword }
    });
    res.json({
        success: true,
        message: 'Password updated successfully'
    });
}));
// ===== USERS ROUTES =====
router.get('/users', auth_1.adminOnly, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('role').optional().isIn(['ADMIN', 'STUDENT']),
    (0, express_validator_1.query)('search').optional().isString(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const search = req.query.search;
    const skip = (page - 1) * limit;
    const where = {};
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
        DB_Config_1.default.user.findMany({
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
        DB_Config_1.default.user.count({ where })
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
}));
router.get('/users/:id', auth_1.adminOnly, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await DB_Config_1.default.user.findUnique({
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
router.put('/users/:id', auth_1.adminOnly, [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('role').optional().isIn(['ADMIN', 'STUDENT']),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
    (0, express_validator_1.body)('isVerified').optional().isBoolean(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { id } = req.params;
    const updates = {};
    const { firstName, lastName, role, isActive, isVerified } = req.body;
    if (firstName)
        updates.firstName = firstName;
    if (lastName)
        updates.lastName = lastName;
    if (role)
        updates.role = role;
    if (typeof isActive === 'boolean')
        updates.isActive = isActive;
    if (typeof isVerified === 'boolean')
        updates.isVerified = isVerified;
    const user = await DB_Config_1.default.user.update({
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
}));
router.delete('/users/:id', auth_1.adminOnly, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (id === req.user.id) {
        return res.status(400).json({
            success: false,
            error: { message: 'Cannot delete your own account' }
        });
    }
    await DB_Config_1.default.user.delete({
        where: { id }
    });
    res.json({
        success: true,
        message: 'User deleted successfully'
    });
}));
router.get('/users/stats/overview', auth_1.adminOnly, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const [totalUsers, totalAdmins, totalCourses, totalEnrollments, recentUsers] = await Promise.all([
        DB_Config_1.default.user.count(),
        DB_Config_1.default.user.count({ where: { role: UserRole.ADMIN } }),
        DB_Config_1.default.course.count(),
        DB_Config_1.default.enrollment.count(),
        DB_Config_1.default.user.findMany({
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
// ===== COURSES ROUTES =====
router.get('/courses', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('category').optional().isString(),
    (0, express_validator_1.query)('level').optional().isString(),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category = req.query.category;
    const level = req.query.level;
    const search = req.query.search;
    const status = req.query.status;
    const skip = (page - 1) * limit;
    const where = {
        status: status || client_1.CourseStatus.PUBLISHED,
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
        DB_Config_1.default.course.findMany({
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
        DB_Config_1.default.course.count({ where })
    ]);
    const coursesWithAvgRating = await Promise.all(courses.map(async (course) => {
        const avgRating = await DB_Config_1.default.review.aggregate({
            where: { courseId: course.id },
            _avg: { rating: true }
        });
        return {
            ...course,
            averageRating: avgRating._avg.rating || 0
        };
    }));
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
}));
router.get('/courses/my-courses', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const courses = await DB_Config_1.default.course.findMany({
        where: { creatorId: userId },
        select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            price: true,
            duration: true,
            level: true,
            status: true,
            tutorName: true,
            createdAt: true,
            updatedAt: true,
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
router.get('/courses/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const course = await DB_Config_1.default.course.findUnique({
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
        return res.status(404).json({
            success: false,
            error: { message: 'Course not found' }
        });
    }
    const avgRating = await DB_Config_1.default.review.aggregate({
        where: { courseId: course.id },
        _avg: { rating: true }
    });
    let isEnrolled = false;
    if (req.user) {
        const enrollment = await DB_Config_1.default.enrollment.findUnique({
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
router.post('/courses', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').trim().isLength({ min: 10 }),
    (0, express_validator_1.body)('price').optional().isNumeric(),
    (0, express_validator_1.body)('duration').optional().isString(),
    (0, express_validator_1.body)('level').optional().isString(),
    (0, express_validator_1.body)('categoryId').notEmpty().withMessage('Category is required').isUUID().withMessage('Category must be a valid UUID'),
    (0, express_validator_1.body)('thumbnail').optional().custom((value) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
            // Allow full URLs and relative paths starting with /uploads/
            const urlRegex = /^(https?:\/\/.+|\/uploads\/.+)$/;
            if (!urlRegex.test(value)) {
                throw new Error('Thumbnail must be a valid URL or path starting with /uploads/');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('tutorName').optional().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('objectives').optional().isArray(),
    (0, express_validator_1.body)('requirements').optional().isArray(),
    (0, express_validator_1.body)('tags').optional().isArray(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { title, description, price = 0, duration, level, categoryId, thumbnail, tutorName, objectives = [], requirements = [], tags = [] } = req.body;
    const course = await DB_Config_1.default.course.create({
        data: {
            title,
            description,
            price: parseFloat(price),
            duration: duration ? parseInt(duration) : null,
            level,
            categoryId,
            thumbnail,
            tutorName: tutorName || `${req.user.firstName} ${req.user.lastName}`,
            creatorId: req.user.id,
            status: client_1.CourseStatus.DRAFT
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
}));
router.put('/courses/:id', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.param)('id').isLength({ min: 1 }).withMessage('Course ID is required'),
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('price').optional().isNumeric(),
    (0, express_validator_1.body)('duration').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('level').optional().isString(),
    (0, express_validator_1.body)('categoryId').optional().isUUID(),
    (0, express_validator_1.body)('thumbnail').optional().custom((value) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
            // Allow full URLs and relative paths starting with /uploads/
            const urlRegex = /^(https?:\/\/.+|\/uploads\/.+)$/;
            if (!urlRegex.test(value)) {
                throw new Error('Thumbnail must be a valid URL or path starting with /uploads/');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('tutorName').optional().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    (0, express_validator_1.body)('isPublic').optional().isBoolean(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { id } = req.params;
    const updates = {};
    const { title, description, price, duration, level, categoryId, thumbnail, tutorName, status, isPublic } = req.body;
    if (title)
        updates.title = title;
    if (description)
        updates.description = description;
    if (price !== undefined)
        updates.price = parseFloat(price);
    if (duration)
        updates.duration = parseInt(duration);
    if (level)
        updates.level = level;
    if (categoryId)
        updates.categoryId = categoryId;
    if (thumbnail)
        updates.thumbnail = thumbnail;
    if (tutorName)
        updates.tutorName = tutorName;
    if (status)
        updates.status = status;
    if (typeof isPublic === 'boolean')
        updates.isPublic = isPublic;
    const existingCourse = await DB_Config_1.default.course.findUnique({
        where: { id }
    });
    if (!existingCourse) {
        return res.status(404).json({
            success: false,
            error: { message: 'Course not found' }
        });
    }
    if (existingCourse.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
            success: false,
            error: { message: 'Not authorized to update this course' }
        });
    }
    const course = await DB_Config_1.default.course.update({
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
}));
router.put('/courses/:id/publish', auth_1.authMiddleware, auth_1.adminOnly, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const course = await DB_Config_1.default.course.findUnique({
        where: { id }
    });
    if (!course) {
        return res.status(404).json({
            success: false,
            error: { message: 'Course not found' }
        });
    }
    if (course.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
            success: false,
            error: { message: 'Not authorized to publish this course' }
        });
    }
    if (course.status === client_1.CourseStatus.PUBLISHED) {
        return res.status(400).json({
            success: false,
            error: { message: 'Course is already published' }
        });
    }
    const updatedCourse = await DB_Config_1.default.course.update({
        where: { id },
        data: {
            status: client_1.CourseStatus.PUBLISHED,
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
            _count: {
                select: {
                    enrollments: true,
                    materials: true,
                    reviews: true
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
}));
router.delete('/courses/:id', auth_1.authMiddleware, auth_1.adminOnly, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const course = await DB_Config_1.default.course.findUnique({
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
    if (course.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
            success: false,
            error: { message: 'Not authorized to delete this course' }
        });
    }
    // Check for active enrollments (not completed)
    const activeEnrollments = course.enrollments.filter(enrollment => enrollment.status !== 'COMPLETED' && enrollment.progressPercentage < 100);
    if (activeEnrollments.length > 0) {
        return res.status(400).json({
            success: false,
            error: { message: `Cannot delete course with ${activeEnrollments.length} active enrollment(s). Wait for students to complete the course or manually mark enrollments as completed.` }
        });
    }
    // Delete all associated material files
    const materialFileUrls = course.materials
        .filter(material => material.fileUrl && material.type !== 'LINK')
        .map(material => material.fileUrl);
    const deletedFilesCount = (0, fileUtils_1.deleteMultipleFiles)(materialFileUrls);
    console.log(`🗑️ Deleted ${deletedFilesCount} material files for course: ${course.title}`);
    // Delete course thumbnail if it exists
    if (course.thumbnail) {
        (0, fileUtils_1.deleteUploadedFile)(course.thumbnail);
    }
    await DB_Config_1.default.course.delete({
        where: { id }
    });
    res.json({
        success: true,
        message: 'Course and all associated files deleted successfully'
    });
}));
router.get('/courses/categories/all', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const categories = await DB_Config_1.default.category.findMany({
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
// ===== CATEGORIES ROUTES =====
router.get('/categories', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const categories = await DB_Config_1.default.category.findMany({
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
router.get('/categories/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const category = await DB_Config_1.default.category.findUnique({
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
router.post('/categories', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.body)('name').trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 500 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { name, description } = req.body;
    const existingCategory = await DB_Config_1.default.category.findUnique({
        where: { name }
    });
    if (existingCategory) {
        return res.status(400).json({
            success: false,
            error: { message: 'Category with this name already exists' }
        });
    }
    const category = await DB_Config_1.default.category.create({
        data: { name, description }
    });
    res.status(201).json({
        success: true,
        data: { category }
    });
}));
router.put('/categories/:id', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.param)('id').isUUID(),
    (0, express_validator_1.body)('name').optional().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 500 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { id } = req.params;
    const updates = {};
    const { name, description } = req.body;
    if (name)
        updates.name = name;
    if (description !== undefined)
        updates.description = description;
    if (name) {
        const existingCategory = await DB_Config_1.default.category.findFirst({
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
    const category = await DB_Config_1.default.category.update({
        where: { id },
        data: updates
    });
    res.json({
        success: true,
        data: { category }
    });
}));
router.delete('/categories/:id', auth_1.authMiddleware, auth_1.adminOnly, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const category = await DB_Config_1.default.category.findUnique({
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
    await DB_Config_1.default.category.delete({
        where: { id }
    });
    res.json({
        success: true,
        message: 'Category deleted successfully'
    });
}));
// ===== MODULES ROUTES =====
router.get('/modules/course/:courseId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const course = await DB_Config_1.default.course.findUnique({
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
    const modules = await DB_Config_1.default.courseModule.findMany({
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
router.get('/modules/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const module = await DB_Config_1.default.courseModule.findUnique({
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
router.post('/modules', auth_1.adminOnly, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 1000 }),
    (0, express_validator_1.body)('orderIndex').isInt({ min: 0 }),
    (0, express_validator_1.body)('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { title, description, orderIndex, courseId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const course = await DB_Config_1.default.course.findUnique({
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
    const module = await DB_Config_1.default.courseModule.create({
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
}));
router.put('/modules/:id', auth_1.adminOnly, [
    (0, express_validator_1.param)('id').isLength({ min: 1 }).withMessage('Module ID is required'),
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 1000 }),
    (0, express_validator_1.body)('orderIndex').optional().isInt({ min: 0 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { id } = req.params;
    const updates = {};
    const userId = req.user.id;
    const userRole = req.user.role;
    const { title, description, orderIndex } = req.body;
    if (title)
        updates.title = title;
    if (description !== undefined)
        updates.description = description;
    if (orderIndex !== undefined)
        updates.orderIndex = parseInt(orderIndex);
    const existingModule = await DB_Config_1.default.courseModule.findUnique({
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
    const module = await DB_Config_1.default.courseModule.update({
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
}));
router.delete('/modules/:id', auth_1.adminOnly, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const module = await DB_Config_1.default.courseModule.findUnique({
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
    await DB_Config_1.default.courseModule.delete({
        where: { id }
    });
    res.json({
        success: true,
        message: 'Module deleted successfully'
    });
}));
router.put('/modules/:id/reorder', auth_1.adminOnly, [
    (0, express_validator_1.param)('id').isLength({ min: 1 }).withMessage('Module ID is required'),
    (0, express_validator_1.body)('newOrderIndex').isInt({ min: 0 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { newOrderIndex } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const module = await DB_Config_1.default.courseModule.findUnique({
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
    const updatedModule = await DB_Config_1.default.courseModule.update({
        where: { id },
        data: { orderIndex: parseInt(newOrderIndex) }
    });
    res.json({
        success: true,
        data: { module: updatedModule }
    });
}));
// ===== MATERIALS ROUTES =====
router.get('/materials/course/:courseId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const course = await DB_Config_1.default.course.findUnique({
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
    const materials = await DB_Config_1.default.material.findMany({
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
router.get('/materials/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const material = await DB_Config_1.default.material.findUnique({
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
    await DB_Config_1.default.progress.upsert({
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
router.post('/materials', auth_1.adminOnly, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('type').isIn(['PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'DOCUMENT', 'LINK']),
    (0, express_validator_1.body)('fileUrl').optional().custom((value) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
            // Allow HTTP/HTTPS URLs, local paths, and www URLs
            const urlRegex = /^(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\/][^\s]*)$/;
            if (!urlRegex.test(value)) {
                throw new Error('Invalid URL or path format');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('content').optional().isString(),
    (0, express_validator_1.body)('orderIndex').isInt({ min: 0 }),
    (0, express_validator_1.body)('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
    (0, express_validator_1.body)('moduleId').optional().isLength({ min: 1 }),
    (0, express_validator_1.body)('isPublic').optional().isBoolean(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { title, description, type, fileUrl, content, orderIndex, courseId, moduleId, isPublic = false } = req.body;
    const course = await DB_Config_1.default.course.findUnique({
        where: { id: courseId }
    });
    if (!course) {
        return res.status(404).json({
            success: false,
            error: { message: 'Course not found' }
        });
    }
    if (course.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
            success: false,
            error: { message: 'Not authorized to add materials to this course' }
        });
    }
    if (type === client_1.MaterialType.LINK && !fileUrl) {
        return res.status(400).json({
            success: false,
            error: { message: 'File URL is required for LINK type materials' }
        });
    }
    const material = await DB_Config_1.default.material.create({
        data: {
            title,
            description,
            type,
            fileUrl,
            content,
            orderIndex: parseInt(orderIndex),
            courseId,
            moduleId,
            authorId: req.user.id,
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
}));
router.put('/materials/:id', auth_1.adminOnly, [
    (0, express_validator_1.param)('id').isLength({ min: 1 }).withMessage('Material ID is required'),
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('type').optional().isIn(['PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'DOCUMENT', 'LINK']),
    (0, express_validator_1.body)('fileUrl').optional().custom((value) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
            // Allow HTTP/HTTPS URLs, local paths, and www URLs
            const urlRegex = /^(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\/][^\s]*)$/;
            if (!urlRegex.test(value)) {
                throw new Error('Invalid URL or path format');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('content').optional().isString(),
    (0, express_validator_1.body)('orderIndex').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('moduleId').optional().isLength({ min: 1 }),
    (0, express_validator_1.body)('isPublic').optional().isBoolean(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { id } = req.params;
    const updates = {};
    const { title, description, type, fileUrl, content, orderIndex, moduleId, isPublic } = req.body;
    if (title)
        updates.title = title;
    if (description !== undefined)
        updates.description = description;
    if (type)
        updates.type = type;
    if (fileUrl !== undefined)
        updates.fileUrl = fileUrl;
    if (content !== undefined)
        updates.content = content;
    if (orderIndex !== undefined)
        updates.orderIndex = parseInt(orderIndex);
    if (moduleId !== undefined)
        updates.moduleId = moduleId;
    if (typeof isPublic === 'boolean')
        updates.isPublic = isPublic;
    const existingMaterial = await DB_Config_1.default.material.findUnique({
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
    if (existingMaterial.course.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
            success: false,
            error: { message: 'Not authorized to update this material' }
        });
    }
    const material = await DB_Config_1.default.material.update({
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
}));
router.delete('/materials/:id', auth_1.adminOnly, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const material = await DB_Config_1.default.material.findUnique({
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
    if (material.course.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
            success: false,
            error: { message: 'Not authorized to delete this material' }
        });
    }
    // Delete the physical file if it exists
    if (material.fileUrl && material.type !== 'LINK') {
        (0, fileUtils_1.deleteUploadedFile)(material.fileUrl);
    }
    // Delete the material from database
    await DB_Config_1.default.material.delete({
        where: { id }
    });
    res.json({
        success: true,
        message: 'Material and associated file deleted successfully'
    });
}));
router.post('/materials/:id/complete', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const material = await DB_Config_1.default.material.findUnique({
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
    const enrollment = await DB_Config_1.default.enrollment.findUnique({
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
    await DB_Config_1.default.progress.upsert({
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
    const totalMaterials = await DB_Config_1.default.material.count({
        where: { courseId: material.courseId }
    });
    const completedMaterials = await DB_Config_1.default.progress.count({
        where: {
            userId,
            courseId: material.courseId,
            isCompleted: true
        }
    });
    const progressPercentage = Math.round((completedMaterials / totalMaterials) * 100);
    await DB_Config_1.default.enrollment.update({
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
// ===== ENROLLMENTS ROUTES =====
router.post('/enrollments/enroll', auth_1.authMiddleware, [
    (0, express_validator_1.body)('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { courseId } = req.body;
    const userId = req.user.id;
    const course = await DB_Config_1.default.course.findUnique({
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
    const existingEnrollment = await DB_Config_1.default.enrollment.findUnique({
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
    const enrollment = await DB_Config_1.default.enrollment.create({
        data: {
            userId,
            courseId,
            status: client_1.EnrollmentStatus.ACTIVE
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
}));
router.get('/enrollments/my-enrollments', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const enrollments = await DB_Config_1.default.enrollment.findMany({
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
    const enrollmentsWithProgress = await Promise.all(enrollments.map(async (enrollment) => {
        const progressRecords = await DB_Config_1.default.progress.findMany({
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
    }));
    res.json({
        success: true,
        data: { enrollments: enrollmentsWithProgress }
    });
}));
router.get('/enrollments/course/:courseId/students', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const course = await DB_Config_1.default.course.findUnique({
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
    const enrollments = await DB_Config_1.default.enrollment.findMany({
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
    const studentsWithProgress = await Promise.all(enrollments.map(async (enrollment) => {
        const progressRecords = await DB_Config_1.default.progress.findMany({
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
    }));
    res.json({
        success: true,
        data: { students: studentsWithProgress }
    });
}));
router.put('/enrollments/:enrollmentId/status', [
    (0, express_validator_1.param)('enrollmentId').isLength({ min: 1 }).withMessage('Enrollment ID is required'),
    (0, express_validator_1.body)('status').isIn(['ACTIVE', 'COMPLETED', 'DROPPED']),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { enrollmentId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const enrollment = await DB_Config_1.default.enrollment.findUnique({
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
        req.user.role === UserRole.ADMIN;
    if (!canModify) {
        return res.status(403).json({
            success: false,
            error: { message: 'Not authorized to modify this enrollment' }
        });
    }
    const updatedEnrollment = await DB_Config_1.default.enrollment.update({
        where: { id: enrollmentId },
        data: {
            status,
            ...(status === client_1.EnrollmentStatus.COMPLETED && { completedAt: new Date() })
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
}));
router.get('/enrollments/progress/:courseId', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    const enrollment = await DB_Config_1.default.enrollment.findUnique({
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
        DB_Config_1.default.material.findMany({
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
        DB_Config_1.default.progress.findMany({
            where: {
                userId,
                courseId
            }
        })
    ]);
    const progressMap = new Map(progressRecords.map(p => [p.materialId, p]));
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
router.delete('/enrollments/:enrollmentId', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { enrollmentId } = req.params;
    const userId = req.user.id;
    const enrollment = await DB_Config_1.default.enrollment.findUnique({
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
        req.user.role === UserRole.ADMIN;
    if (!canDelete) {
        return res.status(403).json({
            success: false,
            error: { message: 'Not authorized to delete this enrollment' }
        });
    }
    await DB_Config_1.default.enrollment.delete({
        where: { id: enrollmentId }
    });
    res.json({
        success: true,
        message: 'Enrollment cancelled successfully'
    });
}));
// ===== UPLOADS ROUTES =====
router.post('/uploads/single', upload.single('file'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: { message: 'No file uploaded' }
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
            url: fileUrl,
            path: req.file.path
        }
    });
}));
router.post('/uploads/multiple', upload.array('files', 5), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            error: { message: 'No files uploaded' }
        });
    }
    const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        path: file.path
    }));
    res.json({
        success: true,
        data: { files: uploadedFiles }
    });
}));
router.post('/uploads/avatar', upload.single('avatar'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: { message: 'No avatar file uploaded' }
        });
    }
    if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({
            success: false,
            error: { message: 'Avatar must be an image file' }
        });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    // Get current user to check for existing avatar
    const currentUser = await DB_Config_1.default.user.findUnique({
        where: { id: req.user.id },
        select: { avatar: true }
    });
    // Delete old avatar if it exists
    if (currentUser?.avatar) {
        (0, fileUtils_1.deleteUploadedFile)(currentUser.avatar);
    }
    await DB_Config_1.default.user.update({
        where: { id: req.user.id },
        data: { avatar: avatarUrl }
    });
    res.json({
        success: true,
        data: {
            filename: req.file.filename,
            url: avatarUrl,
            message: 'Avatar updated successfully'
        }
    });
}));
router.post('/uploads/course-thumbnail', auth_1.authMiddleware, upload.single('thumbnail'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const { courseId } = req.body;
    if (courseId) {
        try {
            const course = await DB_Config_1.default.course.findUnique({
                where: { id: courseId }
            });
            if (!course) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Course not found' }
                });
            }
            if (course.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Not authorized to update this course' }
                });
            }
            const thumbnailUrl = `/uploads/${req.file.filename}`;
            // Get current course to check for existing thumbnail
            const currentCourse = await DB_Config_1.default.course.findUnique({
                where: { id: courseId },
                select: { thumbnail: true }
            });
            // Delete old thumbnail if it exists
            if (currentCourse?.thumbnail) {
                (0, fileUtils_1.deleteUploadedFile)(currentCourse.thumbnail);
            }
            await DB_Config_1.default.course.update({
                where: { id: courseId },
                data: { thumbnail: thumbnailUrl }
            });
            res.json({
                success: true,
                data: {
                    filename: req.file.filename,
                    url: thumbnailUrl,
                    message: 'Course thumbnail updated successfully'
                }
            });
        }
        catch (dbError) {
            console.error('Database error in thumbnail upload:', dbError);
            // Fall back to uploading without course validation if database is down
            const thumbnailUrl = `/uploads/${req.file.filename}`;
            res.json({
                success: true,
                data: {
                    filename: req.file.filename,
                    url: thumbnailUrl,
                    message: 'Thumbnail uploaded successfully (database unavailable, course not updated)'
                }
            });
        }
    }
    else {
        const thumbnailUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            data: {
                filename: req.file.filename,
                url: thumbnailUrl
            }
        });
    }
}));
router.post('/uploads/material', upload.single('file'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: { message: 'No material file uploaded' }
        });
    }
    const { courseId, materialId, type } = req.body;
    // Store URL directly in uploads directory
    const fileUrl = `/uploads/${req.file.filename}`;
    // If courseId is provided, verify user has access
    if (courseId) {
        const course = await DB_Config_1.default.course.findUnique({
            where: { id: courseId }
        });
        if (!course) {
            return res.status(404).json({
                success: false,
                error: { message: 'Course not found' }
            });
        }
        if (course.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: { message: 'Not authorized to upload materials for this course' }
            });
        }
    }
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
router.delete('/uploads/file/:filename', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { filename } = req.params;
    const filePath = path_1.default.join(uploadDir, filename);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            error: { message: 'File not found' }
        });
    }
    try {
        fs_1.default.unlinkSync(filePath);
        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to delete file' }
        });
    }
}));
router.get('/uploads/file-info/:filename', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { filename } = req.params;
    const filePath = path_1.default.join(uploadDir, filename);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            error: { message: 'File not found' }
        });
    }
    const stats = fs_1.default.statSync(filePath);
    const extension = path_1.default.extname(filename);
    res.json({
        success: true,
        data: {
            filename,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            extension,
            url: `/uploads/${filename}`
        }
    });
}));
// ===== ANALYTICS ROUTES =====
router.get('/analytics/tutor', auth_1.authMiddleware, async (req, res) => {
    try {
        const tutorId = req.user.id;
        // Get tutor's courses with enrollment counts
        const courses = await DB_Config_1.default.course.findMany({
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
        let totalEarnings = 0;
        let totalReviews = 0;
        let weightedRating = 0;
        const courseAnalytics = courses.map(course => {
            const materialCount = course.materials.length;
            const studentCount = course._count.enrollments;
            const reviewCount = course._count.reviews;
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
            // Since there's no payment system implemented yet, revenue should be 0
            // totalEarnings += studentCount * course.price;
            totalReviews += reviewCount;
            return {
                id: course.id,
                title: course.title,
                students: studentCount,
                revenue: 0, // No payment system implemented yet
                rating: 0, // Would need to calculate from reviews
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
        const thisMonth = new Date().getMonth();
        const thisMonthStudents = Math.floor(totalStudents * 0.2);
        const lastMonthStudents = Math.floor(totalStudents * 0.18);
        const thisMonthRevenue = 0; // No payment system implemented yet
        const lastMonthRevenue = 0; // No payment system implemented yet
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
    }
    catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch analytics data' }
        });
    }
});
router.get('/analytics/course/:courseId/completion', auth_1.authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const tutorId = req.user.id;
        // Verify course ownership
        const course = await DB_Config_1.default.course.findFirst({
            where: {
                id: courseId,
                creatorId: tutorId
            },
            include: {
                materials: true,
                enrollments: {
                    include: {
                        user: true,
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
                studentName: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
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
    }
    catch (error) {
        console.error('Course completion error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch course completion data' }
        });
    }
});
exports.default = router;
