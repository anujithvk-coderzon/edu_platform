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
const router = express_1.default.Router();
// ===== MULTER SETUP FOR FILE UPLOADS =====
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
        cb(null, `assignment-${sanitizedBaseName}-${uniqueSuffix}${extension}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'application/zip'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type ${file.mimetype} is not allowed for assignments`));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB for assignments
        files: 1
    }
});
// ===== UTILITY FUNCTIONS =====
const generateToken = (studentId) => {
    return jsonwebtoken_1.default.sign({ id: studentId, type: 'student' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
// ===== STUDENT AUTH ROUTES =====
router.post('/auth/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('phone').optional().trim().isMobilePhone('any'),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601(),
    (0, express_validator_1.body)('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
    (0, express_validator_1.body)('country').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('city').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('education').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('institution').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('occupation').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('company').optional().trim().isLength({ min: 1 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, password, firstName, lastName, phone, dateOfBirth, gender, country, city, education, institution, occupation, company } = req.body;
    const existingStudent = await DB_Config_1.default.student.findUnique({
        where: { email }
    });
    if (existingStudent) {
        return res.status(400).json({
            success: false,
            error: { message: 'Student already exists with this email' }
        });
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const student = await DB_Config_1.default.student.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender: gender || null,
            country: country || null,
            city: city || null,
            education: education || null,
            institution: institution || null,
            occupation: occupation || null,
            company: company || null,
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
}));
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
    const student = await DB_Config_1.default.student.findUnique({
        where: { email }
    });
    if (!student || !await bcryptjs_1.default.compare(password, student.password)) {
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
}));
router.post('/auth/logout', (req, res) => {
    res.clearCookie('student_token');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
router.get('/auth/me', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'student') {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid token type.' }
            });
        }
        const student = await DB_Config_1.default.student.findUnique({
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
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
}));
router.put('/auth/profile', [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('avatar').optional().isURL(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'student') {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid token type.' }
            });
        }
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
        const student = await DB_Config_1.default.student.update({
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
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
}));
// ===== COURSES ROUTES =====
router.get('/courses', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('category').optional().isString(),
    (0, express_validator_1.query)('level').optional().isString(),
    (0, express_validator_1.query)('search').optional().isString(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category = req.query.category;
    const level = req.query.level;
    const search = req.query.search;
    const skip = (page - 1) * limit;
    const where = {
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
    // Debug: First check what courses exist in total
    const allCourses = await DB_Config_1.default.course.findMany({
        select: {
            id: true,
            title: true,
            status: true,
            isPublic: true,
            creatorId: true,
            categoryId: true
        }
    });
    console.log('ALL courses in database:', allCourses);
    // Debug: Log the where clause to see what filters are being applied
    console.log('Student courses query filters:', where);
    const [courses, total] = await Promise.all([
        DB_Config_1.default.course.findMany({
            where,
            select: {
                id: true,
                title: true,
                description: true,
                thumbnail: true,
                price: true,
                level: true,
                duration: true,
                status: true,
                isPublic: true,
                creatorId: true,
                tutorName: true,
                createdAt: true,
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
    // Debug: Log what we found
    console.log(`Found ${courses.length} courses out of ${total} total matching filters`);
    console.log('Course details:', courses.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status,
        isPublic: c.isPublic,
        creatorId: c.creatorId,
        hasCreator: !!c.creator
    })));
    const coursesWithAvgRating = await Promise.all(courses.map(async (course) => {
        const avgRating = await DB_Config_1.default.review.aggregate({
            where: { courseId: course.id },
            _avg: { rating: true }
        });
        // Check if user is enrolled (if user is authenticated)
        let isEnrolled = false;
        const token = req.cookies.student_token;
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                if (decoded.type === 'student') {
                    const enrollment = await DB_Config_1.default.enrollment.findFirst({
                        where: {
                            userId: decoded.id,
                            courseId: course.id,
                            status: 'ACTIVE'
                        }
                    });
                    isEnrolled = !!enrollment;
                }
            }
            catch (error) {
                // Token invalid or expired, user not enrolled
            }
        }
        return {
            ...course,
            category: null,
            averageRating: avgRating._avg.rating || 0,
            isEnrolled
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
router.get('/courses/categories/all', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const categories = await DB_Config_1.default.category.findMany({
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
// ===== ENROLLMENT ROUTES =====
// Get my enrollments
router.get('/enrollments/my-enrollments', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const enrollments = await DB_Config_1.default.enrollment.findMany({
            where: { userId: userId },
            select: {
                id: true,
                status: true,
                enrolledAt: true,
                completedAt: true,
                progressPercentage: true,
                course: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        thumbnail: true,
                        price: true,
                        level: true,
                        duration: true,
                        tutorName: true,
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
                                enrollments: true,
                                materials: true,
                                reviews: true
                            }
                        }
                    }
                }
            },
            orderBy: { enrolledAt: 'desc' }
        });
        // Add average rating, review status, and progress data for each course
        const enrichedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {
            const avgRating = await DB_Config_1.default.review.aggregate({
                where: { courseId: enrollment.course.id },
                _avg: { rating: true }
            });
            // Check if user has reviewed this course
            const userReview = await DB_Config_1.default.review.findUnique({
                where: {
                    courseId_userId: {
                        courseId: enrollment.course.id,
                        userId
                    }
                }
            });
            // Get progress data to calculate time spent and completed materials
            const progressRecords = await DB_Config_1.default.progress.findMany({
                where: {
                    userId,
                    courseId: enrollment.course.id
                }
            });
            const totalTimeSpent = progressRecords.reduce((total, record) => total + (record.timeSpent || 0), 0);
            const completedMaterials = progressRecords.filter(record => record.isCompleted).length;
            // If no time is recorded but there's progress, estimate based on course duration and progress
            const courseDurationMinutes = (enrollment.course.duration || 10) * 60; // Convert hours to minutes
            const estimatedTimeSpent = totalTimeSpent > 0 ? totalTimeSpent :
                (enrollment.progressPercentage > 0 ?
                    Math.floor((enrollment.progressPercentage / 100) * courseDurationMinutes) : 0);
            return {
                ...enrollment,
                hasReviewed: !!userReview,
                totalTimeSpent: estimatedTimeSpent,
                completedMaterials,
                course: {
                    ...enrollment.course,
                    averageRating: avgRating._avg.rating || 0
                }
            };
        }));
        res.json({
            success: true,
            data: { enrollments: enrichedEnrollments }
        });
    }
    catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
}));
// Enroll in a course
router.post('/enrollments/enroll', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const { courseId } = req.body;
        if (!courseId) {
            return res.status(400).json({
                success: false,
                error: { message: 'Course ID is required' }
            });
        }
        // Check if course exists and is published
        const course = await DB_Config_1.default.course.findFirst({
            where: {
                id: courseId,
                status: 'PUBLISHED',
                isPublic: true
            }
        });
        if (!course) {
            return res.status(404).json({
                success: false,
                error: { message: 'Course not found or not available for enrollment' }
            });
        }
        // Check if already enrolled
        const existingEnrollment = await DB_Config_1.default.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: userId,
                    courseId: courseId
                }
            }
        });
        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                error: { message: 'Already enrolled in this course' }
            });
        }
        // Create enrollment
        const enrollment = await DB_Config_1.default.enrollment.create({
            data: {
                userId: userId,
                courseId: courseId,
                progressPercentage: 0,
                status: 'ACTIVE'
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: { enrollment },
            message: 'Successfully enrolled in course'
        });
    }
    catch (error) {
        console.error('Error enrolling in course:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to enroll in course' }
        });
    }
}));
// Get progress for a specific course
router.get('/enrollments/progress/:courseId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const { courseId } = req.params;
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
                    description: true,
                    type: true,
                    fileUrl: true,
                    content: true,
                    moduleId: true,
                    orderIndex: true,
                    module: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            orderIndex: true
                        }
                    }
                },
                orderBy: [
                    { module: { orderIndex: 'asc' } },
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
            // Convert relative file URLs to absolute URLs for frontend access
            fileUrl: material.fileUrl && material.fileUrl.startsWith('/uploads/')
                ? `${process.env.BACKEND_URL || 'http://localhost:4000'}${material.fileUrl}`
                : material.fileUrl,
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
    }
    catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
}));
// ===== MATERIALS ENDPOINTS =====
// Get material by ID
router.get('/materials/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const studentId = decoded.id;
        const { id } = req.params;
        // Get material with course info
        const material = await DB_Config_1.default.material.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
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
        // Check if student is enrolled in the course
        const enrollment = await DB_Config_1.default.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: studentId,
                    courseId: material.courseId
                }
            }
        });
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                error: { message: 'You must be enrolled in this course to access materials' }
            });
        }
        // Track material access
        await DB_Config_1.default.progress.upsert({
            where: {
                userId_courseId_materialId: {
                    userId: studentId,
                    courseId: material.courseId,
                    materialId: material.id
                }
            },
            update: {
                lastAccessed: new Date(),
                timeSpent: { increment: 1 }
            },
            create: {
                userId: studentId,
                courseId: material.courseId,
                materialId: material.id,
                lastAccessed: new Date(),
                timeSpent: 1
            }
        });
        // Convert relative file URLs to absolute URLs for frontend access
        const processedMaterial = {
            ...material,
            fileUrl: material.fileUrl && material.fileUrl.startsWith('/uploads/')
                ? `${process.env.BACKEND_URL || 'http://localhost:4000'}${material.fileUrl}`
                : material.fileUrl
        };
        res.json({
            success: true,
            data: { material: processedMaterial }
        });
    }
    catch (error) {
        console.error('Error fetching material:', error);
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
}));
// Mark material as complete
router.post('/materials/:id/complete', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const studentId = decoded.id;
        const { id } = req.params;
        // Get material with course info
        const material = await DB_Config_1.default.material.findUnique({
            where: { id },
            select: {
                id: true,
                courseId: true,
                course: {
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
        // Check if student is enrolled in the course
        const enrollment = await DB_Config_1.default.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: studentId,
                    courseId: material.courseId
                }
            }
        });
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                error: { message: 'You must be enrolled in this course to complete materials' }
            });
        }
        // Mark material as complete
        await DB_Config_1.default.progress.upsert({
            where: {
                userId_courseId_materialId: {
                    userId: studentId,
                    courseId: material.courseId,
                    materialId: material.id
                }
            },
            update: {
                isCompleted: true,
                lastAccessed: new Date()
            },
            create: {
                userId: studentId,
                courseId: material.courseId,
                materialId: material.id,
                isCompleted: true,
                lastAccessed: new Date()
            }
        });
        // Update enrollment progress
        const totalMaterials = await DB_Config_1.default.material.count({
            where: { courseId: material.courseId }
        });
        const completedMaterials = await DB_Config_1.default.progress.count({
            where: {
                userId: studentId,
                courseId: material.courseId,
                isCompleted: true
            }
        });
        const progressPercentage = Math.round((completedMaterials / totalMaterials) * 100);
        await DB_Config_1.default.enrollment.update({
            where: {
                userId_courseId: {
                    userId: studentId,
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
    }
    catch (error) {
        console.error('Error marking material complete:', error);
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
}));
// Test endpoint to check file accessibility
router.get('/test/file/:filename', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { filename } = req.params;
    const filePath = `/uploads/${filename}`;
    const fullUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}${filePath}`;
    res.json({
        success: true,
        data: {
            filename,
            relativePath: filePath,
            fullUrl,
            message: 'File URL constructed successfully'
        }
    });
}));
// ===== COURSE ENDPOINTS WITH RATINGS =====
// Get course by ID with rating information
router.get('/courses/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const token = req.cookies.student_token;
    try {
        const course = await DB_Config_1.default.course.findUnique({
            where: {
                id,
                status: 'PUBLISHED',
                isPublic: true
            },
            select: {
                id: true,
                title: true,
                description: true,
                thumbnail: true,
                price: true,
                level: true,
                duration: true,
                tutorName: true,
                requirements: true,
                prerequisites: true,
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
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
        // Check if user is enrolled and has reviewed (if user is logged in)
        let isEnrolled = false;
        let hasReviewed = false;
        let enrollmentStatus = null;
        let progressPercentage = 0;
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;
                const enrollment = await DB_Config_1.default.enrollment.findUnique({
                    where: {
                        userId_courseId: {
                            userId,
                            courseId: id
                        }
                    }
                });
                isEnrolled = !!enrollment;
                if (enrollment) {
                    enrollmentStatus = enrollment.status;
                    progressPercentage = enrollment.progressPercentage;
                }
                // Check if user has reviewed this course
                const userReview = await DB_Config_1.default.review.findUnique({
                    where: {
                        courseId_userId: {
                            courseId: id,
                            userId
                        }
                    }
                });
                hasReviewed = !!userReview;
            }
            catch (tokenError) {
                // Invalid token, continue with defaults
            }
        }
        // Get rating information
        const reviews = await DB_Config_1.default.review.findMany({
            where: { courseId: id },
            select: { rating: true }
        });
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;
        const courseWithRating = {
            ...course,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length,
            isEnrolled,
            hasReviewed,
            enrollmentStatus,
            progressPercentage
        };
        res.json({
            success: true,
            data: { course: courseWithRating }
        });
    }
    catch (error) {
        console.error('Error fetching course:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch course' }
        });
    }
}));
// ===== REVIEW ENDPOINTS =====
// Submit a course review
router.post('/reviews', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const studentId = decoded.id;
        const { courseId, rating, comment } = req.body;
        // Validate input
        if (!courseId || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: { message: 'Course ID and rating (1-5) are required' }
            });
        }
        // Check if student is enrolled in the course
        const enrollment = await DB_Config_1.default.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: studentId,
                    courseId
                }
            }
        });
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                error: { message: 'You must be enrolled in this course to review it' }
            });
        }
        // Create or update review
        const review = await DB_Config_1.default.review.upsert({
            where: {
                courseId_userId: {
                    courseId,
                    userId: studentId
                }
            },
            update: {
                rating,
                comment: comment || null
            },
            create: {
                courseId,
                userId: studentId,
                rating,
                comment: comment || null
            }
        });
        res.json({
            success: true,
            data: { review },
            message: 'Review submitted successfully'
        });
    }
    catch (error) {
        console.error('Error submitting review:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to submit review' }
        });
    }
}));
// Get reviews for a course
router.get('/reviews/course/:courseId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    try {
        const reviews = await DB_Config_1.default.review.findMany({
            where: { courseId },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Calculate average rating
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;
        const ratingDistribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length
        };
        res.json({
            success: true,
            data: {
                reviews,
                averageRating: Math.round(averageRating * 10) / 10,
                totalReviews: reviews.length,
                ratingDistribution
            }
        });
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch reviews' }
        });
    }
}));
// Get user's review for a specific course
router.get('/reviews/my-review/:courseId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const studentId = decoded.id;
        const { courseId } = req.params;
        const review = await DB_Config_1.default.review.findUnique({
            where: {
                courseId_userId: {
                    courseId,
                    userId: studentId
                }
            }
        });
        res.json({
            success: true,
            data: { review }
        });
    }
    catch (error) {
        console.error('Error fetching user review:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch review' }
        });
    }
}));
// ===== ASSIGNMENT ENDPOINTS =====
// Get assignments for enrolled courses
router.get('/assignments/course/:courseId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const studentId = decoded.id;
        const { courseId } = req.params;
        // Verify enrollment
        const enrollment = await DB_Config_1.default.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: studentId,
                    courseId
                }
            }
        });
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                error: { message: 'You are not enrolled in this course.' }
            });
        }
        const assignments = await DB_Config_1.default.assignment.findMany({
            where: { courseId },
            include: {
                submissions: {
                    where: { studentId },
                    select: {
                        id: true,
                        status: true,
                        score: true,
                        submittedAt: true,
                        gradedAt: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json({
            success: true,
            data: { assignments }
        });
    }
    catch (error) {
        console.error('Get course assignments error:', error);
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
}));
// Submit assignment
router.post('/assignments/:assignmentId/submit', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const studentId = decoded.id;
        const { assignmentId } = req.params;
        const { content, fileUrl } = req.body;
        // Debug logging
        console.log('📝 Assignment submission received:', {
            assignmentId,
            studentId,
            hasContent: !!content && content.trim() !== '',
            contentLength: content ? content.length : 0,
            fileUrl,
            hasFileUrl: !!fileUrl && fileUrl.trim() !== ''
        });
        // Verify assignment exists and student is enrolled
        const assignment = await DB_Config_1.default.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                course: {
                    include: {
                        enrollments: {
                            where: { userId: studentId }
                        }
                    }
                }
            }
        });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                error: { message: 'Assignment not found.' }
            });
        }
        if (assignment.course.enrollments.length === 0) {
            return res.status(403).json({
                success: false,
                error: { message: 'You are not enrolled in this course.' }
            });
        }
        // Check if already submitted
        const existingSubmission = await DB_Config_1.default.assignmentSubmission.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId
                }
            }
        });
        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                error: { message: 'You have already submitted this assignment.' }
            });
        }
        // Check due date
        if (assignment.dueDate && new Date() > assignment.dueDate) {
            return res.status(400).json({
                success: false,
                error: { message: 'Assignment due date has passed.' }
            });
        }
        const submission = await DB_Config_1.default.assignmentSubmission.create({
            data: {
                content: content || '',
                fileUrl: fileUrl || null,
                assignmentId,
                studentId,
                status: 'SUBMITTED'
            },
            include: {
                assignment: {
                    select: {
                        title: true,
                        maxScore: true,
                        dueDate: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: { submission }
        });
    }
    catch (error) {
        console.error('Submit assignment error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to submit assignment.' }
        });
    }
}));
// Get assignment submission
router.get('/assignments/:assignmentId/submission', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const studentId = decoded.id;
        const { assignmentId } = req.params;
        const submission = await DB_Config_1.default.assignmentSubmission.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId
                }
            },
            include: {
                assignment: {
                    select: {
                        title: true,
                        maxScore: true,
                        dueDate: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: { submission }
        });
    }
    catch (error) {
        console.error('Get assignment submission error:', error);
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
}));
// Upload assignment file
router.post('/assignments/upload', upload.single('file'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.student_token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access denied. No token provided.' }
        });
    }
    try {
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No assignment file uploaded' }
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
                fileUrl: fileUrl
            }
        });
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
}));
exports.default = router;
