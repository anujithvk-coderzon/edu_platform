"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPlatformStats = exports.StudentUploadAssignmentFile = exports.StudentGetAssignmentSubmission = exports.StudentSubmitAssignment = exports.StudentGetCourseAssignments = exports.StudentGetMyReview = exports.StudentGetCourseReviews = exports.StudentSubmitReview = exports.StudentMarkMaterialComplete = exports.StudentGetMaterial = exports.StudentGetEnrollmentProgress = exports.StudentEnrollInCourse = exports.StudentGetMyEnrollments = exports.StudentGetCourseCategories = exports.StudentGetCourseById = exports.StudentGetCourses = exports.StudentUploadAvatar = exports.StudentChangePassword = exports.StudentUpdateProfile = exports.StudentGetProfile = exports.StudentResetPassword = exports.StudentVerifyForgotPasswordOtp = exports.StudentForgotPassword = exports.StudentLogout = exports.StudentLogin = exports.StudentResendOtp = exports.StudentVerifyRegistrationOtp = exports.StudentRegister = exports.StudentVerifyEmailOtp = exports.StudentVerifyEmail = exports.StudentCheckEmail = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
// Import prisma and utilities
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const EmailVerification_1 = require("../utils/EmailVerification");
const CDN_management_1 = require("../utils/CDN_management");
// ===== UTILITY FUNCTIONS =====
const generateToken = (studentId) => {
    return jsonwebtoken_1.default.sign({ id: studentId, type: 'student' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
// ===== STUDENT AUTH CONTROLLERS =====
const StudentCheckEmail = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Please provide a valid email address', details: errors.array() }
        });
    }
    const { email } = req.body;
    const existingStudent = await DB_Config_1.default.student.findUnique({
        where: { email }
    });
    if (existingStudent) {
        return res.status(400).json({
            success: false,
            error: { message: 'An account with this email already exists' }
        });
    }
    res.status(200).json({
        success: true,
        message: 'Email is available',
        data: { email, available: true }
    });
};
exports.StudentCheckEmail = StudentCheckEmail;
const StudentVerifyEmail = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Please provide a valid email address', details: errors.array() }
        });
    }
    const { email } = req.body;
    const existingStudent = await DB_Config_1.default.student.findUnique({
        where: { email }
    });
    if (existingStudent) {
        return res.status(400).json({
            success: false,
            error: { message: 'An account with this email already exists' }
        });
    }
    const otp = (0, EmailVerification_1.generateOTP)();
    (0, EmailVerification_1.storeOTP)(email, otp, null);
    const emailResult = await (0, EmailVerification_1.sendVerificationEmail)(email, otp);
    if (!emailResult.success) {
        return res.status(500).json({
            success: false,
            error: { message: emailResult.error || 'Failed to send verification email. Please try again.' }
        });
    }
    res.status(200).json({
        success: true,
        message: 'Verification code sent to your email. Please check your inbox.',
        data: { email }
    });
};
exports.StudentVerifyEmail = StudentVerifyEmail;
const StudentVerifyEmailOtp = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, otp } = req.body;
    const verification = (0, EmailVerification_1.verifyOTP)(email, otp);
    if (!verification.valid) {
        return res.status(400).json({
            success: false,
            error: { message: verification.message || 'Invalid or expired OTP. Please try again.' }
        });
    }
    res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now complete your registration.',
        data: { email, verified: true }
    });
};
exports.StudentVerifyEmailOtp = StudentVerifyEmailOtp;
const StudentRegister = async (req, res) => {
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
    const otp = (0, EmailVerification_1.generateOTP)();
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const userData = {
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
    };
    (0, EmailVerification_1.storeOTP)(email, otp, userData);
    const emailResult = await (0, EmailVerification_1.sendVerificationEmail)(email, otp);
    if (!emailResult.success) {
        return res.status(500).json({
            success: false,
            error: { message: emailResult.error || 'Failed to send verification email. Please try again.' }
        });
    }
    res.status(200).json({
        success: true,
        message: 'OTP sent to your email. Please verify to complete registration.',
        data: { email }
    });
};
exports.StudentRegister = StudentRegister;
const StudentVerifyRegistrationOtp = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, otp } = req.body;
    const verification = (0, EmailVerification_1.verifyOTP)(email, otp);
    if (!verification.valid) {
        return res.status(400).json({
            success: false,
            error: { message: verification.message || 'Invalid or expired OTP. Please try again.' }
        });
    }
    const userData = verification.userData;
    const student = await DB_Config_1.default.student.create({
        data: userData,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            country: true,
            city: true,
            education: true,
            institution: true,
            occupation: true,
            company: true,
            avatar: true,
            createdAt: true
        }
    });
    const token = generateToken(student.id);
    res.cookie('student_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // Send welcome email (don't block registration if it fails)
    try {
        const welcomeEmailResult = await (0, EmailVerification_1.WelcomeEmail)(userData.email, userData.firstName);
        if (!welcomeEmailResult.success) {
            console.error('⚠️ Welcome email failed but registration continues:', welcomeEmailResult.error);
        }
    }
    catch (error) {
        console.error('⚠️ Welcome email error but registration continues:', error);
    }
    res.status(201).json({
        success: true,
        message: 'Email verified successfully. Account created!',
        data: { user: student, token }
    });
};
exports.StudentVerifyRegistrationOtp = StudentVerifyRegistrationOtp;
const StudentResendOtp = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email } = req.body;
    const otp = (0, EmailVerification_1.generateOTP)();
    const emailResult = await (0, EmailVerification_1.sendVerificationEmail)(email, otp);
    if (!emailResult.success) {
        return res.status(500).json({
            success: false,
            error: { message: emailResult.error || 'Failed to send verification email. Please try again.' }
        });
    }
    res.status(200).json({
        success: true,
        message: 'New OTP sent to your email.',
        data: { email }
    });
};
exports.StudentResendOtp = StudentResendOtp;
const StudentLogin = async (req, res) => {
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
};
exports.StudentLogin = StudentLogin;
const StudentLogout = (req, res) => {
    res.clearCookie('student_token');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};
exports.StudentLogout = StudentLogout;
const StudentForgotPassword = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Please provide a valid email address', details: errors.array() }
        });
    }
    const { email } = req.body;
    const student = await DB_Config_1.default.student.findUnique({
        where: { email }
    });
    if (!student) {
        // Don't reveal if email exists for security reasons
        return res.status(200).json({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset code.',
            data: { email }
        });
    }
    const otp = (0, EmailVerification_1.generateOTP)();
    (0, EmailVerification_1.StoreForgetOtp)(email, otp);
    const emailResult = await (0, EmailVerification_1.ForgetPasswordMail)(email, otp);
    if (!emailResult.success) {
        return res.status(500).json({
            success: false,
            error: { message: emailResult.error || 'Failed to send password reset email. Please try again.' }
        });
    }
    res.status(200).json({
        success: true,
        message: 'Password reset code sent to your email. Please check your inbox.',
        data: { email }
    });
};
exports.StudentForgotPassword = StudentForgotPassword;
const StudentVerifyForgotPasswordOtp = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, otp } = req.body;
    const verification = (0, EmailVerification_1.VerifyForgetOtp)(email, otp);
    if (!verification.valid) {
        return res.status(400).json({
            success: false,
            error: { message: verification.message || 'Invalid or expired OTP. Please try again.' }
        });
    }
    res.status(200).json({
        success: true,
        message: 'OTP verified successfully! You can now reset your password.',
        data: { email, otpVerified: true }
    });
};
exports.StudentVerifyForgotPasswordOtp = StudentVerifyForgotPasswordOtp;
const StudentResetPassword = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, otp, newPassword } = req.body;
    const verification = (0, EmailVerification_1.VerifyForgetOtp)(email, otp);
    if (!verification.valid) {
        return res.status(400).json({
            success: false,
            error: { message: verification.message || 'Invalid or expired OTP. Please request a new password reset.' }
        });
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
    const updatedStudent = await DB_Config_1.default.student.update({
        where: { email },
        data: { password: hashedPassword },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
        }
    });
    (0, EmailVerification_1.ClearForgetOtp)(email);
    res.status(200).json({
        success: true,
        message: 'Password reset successfully! You can now login with your new password.',
        data: {
            email: updatedStudent.email,
            firstName: updatedStudent.firstName
        }
    });
};
exports.StudentResetPassword = StudentResetPassword;
const StudentGetProfile = async (req, res) => {
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
};
exports.StudentGetProfile = StudentGetProfile;
const StudentUpdateProfile = async (req, res) => {
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
};
exports.StudentUpdateProfile = StudentUpdateProfile;
const StudentChangePassword = async (req, res) => {
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
        const { currentPassword, newPassword } = req.body;
        const student = await DB_Config_1.default.student.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                password: true,
                firstName: true,
                lastName: true
            }
        });
        if (!student) {
            return res.status(404).json({
                success: false,
                error: { message: 'Student not found.' }
            });
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, student.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: { message: 'Current password is incorrect.' }
            });
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await DB_Config_1.default.student.update({
            where: { id: student.id },
            data: { password: hashedNewPassword }
        });
        res.json({
            success: true,
            message: 'Password changed successfully!'
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
};
exports.StudentChangePassword = StudentChangePassword;
const StudentUploadAvatar = async (req, res) => {
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
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No avatar file uploaded' }
            });
        }
        const avatarUrl = await (0, CDN_management_1.Upload_Files)('images', req.file);
        // Get current student to check for existing avatar
        const currentStudent = await DB_Config_1.default.student.findUnique({
            where: { id: decoded.id },
            select: { avatar: true }
        });
        await (0, CDN_management_1.Delete_File)('images', currentStudent.avatar);
        const student = await DB_Config_1.default.student.update({
            where: { id: decoded.id },
            data: { avatar: avatarUrl },
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
            data: {
                url: avatarUrl,
                user: student
            },
            message: 'Avatar uploaded successfully'
        });
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
};
exports.StudentUploadAvatar = StudentUploadAvatar;
// ===== STUDENT COURSE CONTROLLERS =====
const StudentGetCourses = async (req, res) => {
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
                            studentId: decoded.id,
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
};
exports.StudentGetCourses = StudentGetCourses;
const StudentGetCourseById = async (req, res) => {
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
                        studentId_courseId: {
                            studentId: userId,
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
                        courseId_studentId: {
                            courseId: id,
                            studentId: userId
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
};
exports.StudentGetCourseById = StudentGetCourseById;
const StudentGetCourseCategories = async (req, res) => {
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
};
exports.StudentGetCourseCategories = StudentGetCourseCategories;
// ===== STUDENT ENROLLMENT CONTROLLERS =====
const StudentGetMyEnrollments = async (req, res) => {
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
            where: { studentId: userId },
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
                    courseId_studentId: {
                        courseId: enrollment.course.id,
                        studentId: userId
                    }
                }
            });
            // Get progress data to calculate time spent and completed materials
            const progressRecords = await DB_Config_1.default.progress.findMany({
                where: {
                    studentId: userId,
                    courseId: enrollment.course.id
                }
            });
            const totalTimeSpent = progressRecords.reduce((total, record) => total + (record.timeSpent || 0), 0);
            const completedMaterials = progressRecords.filter(record => record.isCompleted).length;
            // If no time is recorded but there's progress, estimate based on course duration and progress
            const courseDurationMinutes = (enrollment.course?.duration || 10) * 60; // Convert hours to minutes
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
};
exports.StudentGetMyEnrollments = StudentGetMyEnrollments;
const StudentEnrollInCourse = async (req, res) => {
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
                studentId_courseId: {
                    studentId: userId,
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
                studentId: userId,
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
};
exports.StudentEnrollInCourse = StudentEnrollInCourse;
const StudentGetEnrollmentProgress = async (req, res) => {
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
                studentId_courseId: {
                    studentId: userId,
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
                    studentId: userId,
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
        // Get assignments for this course
        const [assignments, assignmentSubmissions] = await Promise.all([
            DB_Config_1.default.assignment.findMany({
                where: { courseId },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    dueDate: true,
                    maxScore: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'asc' }
            }),
            DB_Config_1.default.assignmentSubmission.findMany({
                where: {
                    studentId: userId,
                    assignment: { courseId }
                },
                select: {
                    id: true,
                    assignmentId: true,
                    submittedAt: true,
                    status: true,
                    score: true,
                    feedback: true
                }
            })
        ]);
        const submissionMap = new Map(assignmentSubmissions.map(s => [s.assignmentId, s]));
        const assignmentsWithSubmissions = assignments.map(assignment => ({
            ...assignment,
            submission: submissionMap.get(assignment.id) || null
        }));
        const totalMaterials = materials.length;
        const completedMaterials = progressRecords.filter(p => p.isCompleted).length;
        const totalAssignments = assignments.length;
        const submittedAssignments = assignmentSubmissions.length;
        const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
        // Calculate overall progress including assignments
        const totalItems = totalMaterials + totalAssignments;
        const completedItems = completedMaterials + submittedAssignments;
        const overallProgressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        res.json({
            success: true,
            data: {
                enrollment: {
                    ...enrollment,
                    progressPercentage: overallProgressPercentage
                },
                materials: materialsWithProgress,
                assignments: assignmentsWithSubmissions,
                stats: {
                    totalMaterials,
                    completedMaterials,
                    totalAssignments,
                    submittedAssignments,
                    progressPercentage: overallProgressPercentage,
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
};
exports.StudentGetEnrollmentProgress = StudentGetEnrollmentProgress;
// ===== STUDENT MATERIAL CONTROLLERS =====
const StudentGetMaterial = async (req, res) => {
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
                studentId_courseId: {
                    studentId: studentId,
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
                studentId_courseId_materialId: {
                    studentId: studentId,
                    courseId: material.courseId,
                    materialId: material.id
                }
            },
            update: {
                lastAccessed: new Date(),
                timeSpent: { increment: 1 }
            },
            create: {
                studentId: studentId,
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
};
exports.StudentGetMaterial = StudentGetMaterial;
const StudentMarkMaterialComplete = async (req, res) => {
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
                studentId_courseId: {
                    studentId: studentId,
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
                studentId_courseId_materialId: {
                    studentId: studentId,
                    courseId: material.courseId,
                    materialId: material.id
                }
            },
            update: {
                isCompleted: true,
                lastAccessed: new Date()
            },
            create: {
                studentId: studentId,
                courseId: material.courseId,
                materialId: material.id,
                isCompleted: true,
                lastAccessed: new Date()
            }
        });
        // Update enrollment progress including assignments
        const [totalMaterials, completedMaterials, totalAssignments, submittedAssignments] = await Promise.all([
            DB_Config_1.default.material.count({ where: { courseId: material.courseId } }),
            DB_Config_1.default.progress.count({
                where: {
                    studentId: studentId,
                    courseId: material.courseId,
                    isCompleted: true
                }
            }),
            DB_Config_1.default.assignment.count({ where: { courseId: material.courseId } }),
            DB_Config_1.default.assignmentSubmission.count({
                where: {
                    studentId,
                    assignment: { courseId: material.courseId }
                }
            })
        ]);
        // Calculate progress including both materials and assignments
        const totalItems = totalMaterials + totalAssignments;
        const completedItems = completedMaterials + submittedAssignments;
        const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        await DB_Config_1.default.enrollment.update({
            where: {
                studentId_courseId: {
                    studentId: studentId,
                    courseId: material.courseId
                }
            },
            data: {
                progressPercentage,
                ...(progressPercentage === 100 && { completedAt: new Date(), status: 'COMPLETED' })
            }
        });
        res.json({
            success: true,
            data: {
                progressPercentage,
                isCompleted: true,
                totalItems: totalMaterials + totalAssignments,
                completedItems: completedMaterials + submittedAssignments
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
};
exports.StudentMarkMaterialComplete = StudentMarkMaterialComplete;
// ===== STUDENT REVIEW CONTROLLERS =====
const StudentSubmitReview = async (req, res) => {
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
                studentId_courseId: {
                    studentId: studentId,
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
                courseId_studentId: {
                    courseId,
                    studentId: studentId
                }
            },
            update: {
                rating,
                comment: comment || null
            },
            create: {
                courseId,
                studentId: studentId,
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
};
exports.StudentSubmitReview = StudentSubmitReview;
const StudentGetCourseReviews = async (req, res) => {
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
};
exports.StudentGetCourseReviews = StudentGetCourseReviews;
const StudentGetMyReview = async (req, res) => {
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
                courseId_studentId: {
                    courseId,
                    studentId: studentId
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
};
exports.StudentGetMyReview = StudentGetMyReview;
// ===== STUDENT ASSIGNMENT CONTROLLERS =====
const StudentGetCourseAssignments = async (req, res) => {
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
                studentId_courseId: {
                    studentId: studentId,
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
};
exports.StudentGetCourseAssignments = StudentGetCourseAssignments;
const StudentSubmitAssignment = async (req, res) => {
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
        // Verify assignment exists and student is enrolled
        const assignment = await DB_Config_1.default.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                course: {
                    include: {
                        enrollments: {
                            where: { studentId: studentId }
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
        // Update enrollment progress to include this new assignment submission
        const [totalMaterials, completedMaterials, totalAssignments, submittedAssignments] = await Promise.all([
            DB_Config_1.default.material.count({ where: { courseId: assignment.courseId } }),
            DB_Config_1.default.progress.count({
                where: {
                    studentId: studentId,
                    courseId: assignment.courseId,
                    isCompleted: true
                }
            }),
            DB_Config_1.default.assignment.count({ where: { courseId: assignment.courseId } }),
            DB_Config_1.default.assignmentSubmission.count({
                where: {
                    studentId,
                    assignment: { courseId: assignment.courseId }
                }
            })
        ]);
        // Calculate progress including both materials and assignments
        const totalItems = totalMaterials + totalAssignments;
        const completedItems = completedMaterials + submittedAssignments;
        const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        await DB_Config_1.default.enrollment.update({
            where: {
                studentId_courseId: {
                    studentId: studentId,
                    courseId: assignment.courseId
                }
            },
            data: {
                progressPercentage,
                ...(progressPercentage === 100 && { completedAt: new Date(), status: 'COMPLETED' })
            }
        });
        res.status(201).json({
            success: true,
            data: {
                submission,
                progressUpdate: {
                    progressPercentage,
                    totalItems,
                    completedItems
                }
            }
        });
    }
    catch (error) {
        console.error('Submit assignment error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to submit assignment.' }
        });
    }
};
exports.StudentSubmitAssignment = StudentSubmitAssignment;
const StudentGetAssignmentSubmission = async (req, res) => {
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
};
exports.StudentGetAssignmentSubmission = StudentGetAssignmentSubmission;
const StudentUploadAssignmentFile = async (req, res) => {
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
};
exports.StudentUploadAssignmentFile = StudentUploadAssignmentFile;
// ===== PUBLIC CONTROLLERS =====
const GetPlatformStats = async (req, res) => {
    try {
        // Get all published courses with enrollment data
        const courses = await DB_Config_1.default.course.findMany({
            where: {
                status: 'PUBLISHED' // Only count published courses
            },
            include: {
                enrollments: {
                    select: {
                        studentId: true,
                        enrolledAt: true
                    }
                },
                reviews: {
                    select: {
                        rating: true
                    }
                },
                _count: {
                    select: {
                        enrollments: true,
                        reviews: true
                    }
                }
            }
        });
        // Calculate unique students across all courses
        const uniqueStudentIds = new Set();
        let totalEnrollments = 0;
        courses.forEach(course => {
            course.enrollments.forEach(enrollment => {
                uniqueStudentIds.add(enrollment.studentId);
                totalEnrollments++;
            });
        });
        const totalUniqueStudents = uniqueStudentIds.size;
        // Calculate average rating across all courses
        let totalRatings = 0;
        let totalReviews = 0;
        courses.forEach(course => {
            if (course.reviews.length > 0) {
                const courseRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
                totalRatings += courseRating;
                totalReviews += course.reviews.length;
            }
        });
        const averageRating = totalReviews > 0 ? totalRatings / totalReviews : 0;
        // Calculate recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentEnrollments = courses.reduce((count, course) => {
            return count + course.enrollments.filter(e => new Date(e.enrolledAt) > thirtyDaysAgo).length;
        }, 0);
        const stats = {
            totalCourses: courses.length,
            totalStudents: totalUniqueStudents,
            totalEnrollments: totalEnrollments,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: totalReviews,
            recentActivity: recentEnrollments,
            lastUpdated: new Date().toISOString()
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Platform stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch platform statistics' }
        });
    }
};
exports.GetPlatformStats = GetPlatformStats;
