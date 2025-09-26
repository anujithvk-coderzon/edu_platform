"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadAvatar = exports.UploadMultipleFiles = exports.UploadSingleFile = exports.DeleteEnrollment = exports.GetEnrollmentProgress = exports.UpdateEnrollmentStatus = exports.GetCourseStudents = exports.GetMyEnrollments = exports.EnrollInCourse = exports.CompleteMaterial = exports.DeleteMaterial = exports.UpdateMaterial = exports.CreateMaterial = exports.GetMaterialById = exports.GetCourseMaterials = exports.ReorderModule = exports.DeleteModule = exports.UpdateModule = exports.CreateModule = exports.GetModuleById = exports.GetCourseModules = exports.DeleteCategory = exports.UpdateCategory = exports.CreateCategory = exports.GetCategoryById = exports.GetAllCategories = exports.DeleteCourse = exports.PublishCourse = exports.UpdateCourse = exports.CreateCourse = exports.GetCourseById = exports.GetAllTutors = exports.GetMyCourses = exports.GetAllCourses = exports.GetUserStats = exports.DeleteUser = exports.UpdateUser = exports.GetUserById = exports.GetAllUsers = exports.ChangePassword = exports.UpdateProfile = exports.GetCurrentUser = exports.AdminResetPassword = exports.AdminVerifyForgotPasswordOtp = exports.AdminForgotPassword = exports.LogoutUser = exports.LoginUser = exports.RegisterTutor = exports.RegisterUser = exports.BootstrapAdmin = void 0;
exports.UploadAssignmentFile = exports.GetStudentSubmission = exports.SubmitAssignment = exports.GetStudentCourseAssignments = exports.GetCourseCompletion = exports.GetTutorAnalytics = exports.GetFileInfo = exports.DeleteUploadedFile = exports.UploadMaterial = exports.UploadCourseThumbnail = void 0;
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Import prisma and types
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const client_1 = require("@prisma/client");
// Import utilities
const fileUtils_1 = require("../utils/fileUtils");
const EmailVerification_1 = require("../utils/EmailVerification");
const CDN_management_1 = require("../utils/CDN_management");
const CDN_streaming_1 = require("../utils/CDN_streaming");
const localStorage_1 = require("../utils/localStorage");
// ===== UTILITY FUNCTIONS =====
const GenerateToken = (userId, type = 'admin') => {
    return jsonwebtoken_1.default.sign({ id: userId, type }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
// ===== AUTH CONTROLLERS =====
const BootstrapAdmin = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors.array() }
            });
        }
        const adminExists = await DB_Config_1.default.admin.findFirst();
        if (adminExists) {
            return res.status(400).json({
                success: false,
                error: { message: 'Admin already exists. Use /register endpoint.' }
            });
        }
        const { email, password, firstName, lastName } = req.body;
        const existingAdmin = await DB_Config_1.default.admin.findUnique({
            where: { email }
        });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                error: { message: 'Admin already exists with this email' }
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await DB_Config_1.default.admin.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: "Admin",
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
        const token = GenerateToken(user.id);
        // Set role-specific cookie names (BootstrapAdmin always creates ADMIN)
        const cookieName = 'admin_token';
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(201).json({
            success: true,
            data: { user, token }
        });
    }
    catch (error) {
        console.error('BootstrapAdmin error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.BootstrapAdmin = BootstrapAdmin;
const RegisterUser = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors.array() }
            });
        }
        const { email, password, firstName, lastName } = req.body;
        const existingUser = await DB_Config_1.default.admin.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: { message: 'User already exists with this email' }
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await DB_Config_1.default.admin.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: "Admin",
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
        const token = GenerateToken(user.id);
        // Set role-specific cookie names (RegisterUser creates ADMIN by default)
        const cookieName = 'admin_token';
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(201).json({
            success: true,
            data: { user, token }
        });
    }
    catch (error) {
        console.error('RegisterUser error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.RegisterUser = RegisterUser;
const RegisterTutor = async (req, res) => {
    try {
        // Only admins can register tutors
        if (req.user.type !== "admin" || req.user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                error: { message: 'Only admins can register tutors' }
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
        const existingUser = await DB_Config_1.default.admin.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: { message: 'User already exists with this email' }
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const tutor = await DB_Config_1.default.admin.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: "Tutor",
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
        return res.status(201).json({
            success: true,
            data: { tutor },
            message: 'Tutor registered successfully'
        });
    }
    catch (error) {
        console.error('RegisterTutor error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.RegisterTutor = RegisterTutor;
const LoginUser = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors.array() }
            });
        }
        const { email, password } = req.body;
        const user = await DB_Config_1.default.admin.findUnique({
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
        const token = GenerateToken(user.id);
        // Set role-specific cookie names
        const cookieName = 'admin_token'; // This is admin login, always use admin_token
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        const { password: _, ...userWithoutPassword } = user;
        return res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token
            }
        });
    }
    catch (error) {
        console.error('LoginUser error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.LoginUser = LoginUser;
const LogoutUser = (req, res) => {
    // Only clear the cookie for the current user's type
    const cookieName = req.user.type === "admin" ? 'admin_token' : 'student_token';
    res.clearCookie(cookieName);
    return res.json({
        success: true,
        message: 'Logged out successfully'
    });
};
exports.LogoutUser = LogoutUser;
// Forgot Password for Admin - Step 1: Send OTP to email
const AdminForgotPassword = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Please provide a valid email address', details: errors.array() }
            });
        }
        const { email } = req.body;
        // Check if admin exists with this email
        const admin = await DB_Config_1.default.admin.findUnique({
            where: { email }
        });
        if (!admin) {
            // Don't reveal if email exists for security reasons
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset code.',
                data: { email }
            });
        }
        // Generate OTP
        const otp = (0, EmailVerification_1.generateOTP)();
        // Store OTP for forgot password
        (0, EmailVerification_1.StoreForgetOtp)(email, otp);
        // Send OTP via email
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
    }
    catch (error) {
        console.error('AdminForgotPassword error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.AdminForgotPassword = AdminForgotPassword;
// Forgot Password for Admin - Step 2: Verify OTP
const AdminVerifyForgotPasswordOtp = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors.array() }
            });
        }
        const { email, otp } = req.body;
        // Verify OTP
        const verification = (0, EmailVerification_1.VerifyForgetOtp)(email, otp);
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                error: { message: verification.message || 'Invalid or expired OTP. Please try again.' }
            });
        }
        // OTP is valid, return success
        res.status(200).json({
            success: true,
            message: 'OTP verified successfully! You can now reset your password.',
            data: { email, otpVerified: true }
        });
    }
    catch (error) {
        console.error('AdminVerifyForgotPasswordOtp error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.AdminVerifyForgotPasswordOtp = AdminVerifyForgotPasswordOtp;
// Forgot Password for Admin - Step 3: Reset Password
const AdminResetPassword = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors.array() }
            });
        }
        const { email, otp, newPassword } = req.body;
        // Verify OTP again before resetting password
        const verification = (0, EmailVerification_1.VerifyForgetOtp)(email, otp);
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                error: { message: verification.message || 'Invalid or expired OTP. Please request a new password reset.' }
            });
        }
        // Hash the new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        // Update the admin's password
        const updatedAdmin = await DB_Config_1.default.admin.update({
            where: { email },
            data: { password: hashedPassword },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true
            }
        });
        // Clear the OTP after successful password reset
        (0, EmailVerification_1.ClearForgetOtp)(email);
        res.status(200).json({
            success: true,
            message: 'Password reset successfully! You can now login with your new password.',
            data: {
                email: updatedAdmin.email,
                firstName: updatedAdmin.firstName,
                role: updatedAdmin.role
            }
        });
    }
    catch (error) {
        console.error('AdminResetPassword error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.AdminResetPassword = AdminResetPassword;
const GetCurrentUser = async (req, res) => {
    try {
        const user = await DB_Config_1.default.admin.findUnique({
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
        return res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        console.error('GetCurrentUser error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetCurrentUser = GetCurrentUser;
const UpdateProfile = async (req, res) => {
    try {
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
        const user = await DB_Config_1.default.admin.update({
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
        return res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        console.error('UpdateProfile error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UpdateProfile = UpdateProfile;
const ChangePassword = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors.array() }
            });
        }
        const { currentPassword, newPassword } = req.body;
        const user = await DB_Config_1.default.admin.findUnique({
            where: { id: req.user.id }
        });
        if (!user || !await bcryptjs_1.default.compare(currentPassword, user.password)) {
            return res.status(401).json({
                success: false,
                error: { message: 'Current password is incorrect' }
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await DB_Config_1.default.admin.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });
        return res.json({
            success: true,
            message: 'Password updated successfully'
        });
    }
    catch (error) {
        console.error('ChangePassword error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.ChangePassword = ChangePassword;
// ===== USER MANAGEMENT CONTROLLERS =====
const GetAllUsers = async (req, res) => {
    try {
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
            DB_Config_1.default.admin.findMany({
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
                            createdCourses: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            DB_Config_1.default.admin.count({ where })
        ]);
        return res.json({
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
    }
    catch (error) {
        console.error('GetAllUsers error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetAllUsers = GetAllUsers;
const GetUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await DB_Config_1.default.admin.findUnique({
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
                        materials: true,
                        assignments: true,
                        announcements: true
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
        return res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        console.error('GetUserById error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetUserById = GetUserById;
const UpdateUser = async (req, res) => {
    try {
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
        const user = await DB_Config_1.default.admin.update({
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
        return res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        console.error('UpdateUser error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UpdateUser = UpdateUser;
const DeleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                error: { message: 'Cannot delete your own account' }
            });
        }
        await DB_Config_1.default.admin.delete({
            where: { id }
        });
        return res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('DeleteUser error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.DeleteUser = DeleteUser;
const GetUserStats = async (req, res) => {
    try {
        const [totalUsers, totalAdmins, totalCourses, totalEnrollments, recentUsers] = await Promise.all([
            DB_Config_1.default.admin.count(),
            DB_Config_1.default.admin.count({ where: { role: "Admin" } }),
            DB_Config_1.default.course.count(),
            DB_Config_1.default.enrollment.count(),
            DB_Config_1.default.admin.findMany({
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
        return res.json({
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
    }
    catch (error) {
        console.error('GetUserStats error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetUserStats = GetUserStats;
// ===== COURSE CONTROLLERS =====
const GetAllCourses = async (req, res) => {
    try {
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
        return res.json({
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
    }
    catch (error) {
        console.error('GetAllCourses error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetAllCourses = GetAllCourses;
const GetMyCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role; // This is the specific admin role (admin/tutor)
        let whereClause = {};
        if (userRole === "Admin") {
            // Admin can see all courses
            whereClause = {};
        }
        else if (userRole === "Tutor") {
            // Tutor can see courses they created or are assigned to
            whereClause = {
                OR: [
                    { creatorId: userId },
                    { tutorId: userId }
                ]
            };
        }
        else {
            // Students see only courses they created (if any)
            whereClause = { creatorId: userId };
        }
        const courses = await DB_Config_1.default.course.findMany({
            where: whereClause,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
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
        return res.json({
            success: true,
            data: { courses }
        });
    }
    catch (error) {
        console.error('GetMyCourses error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetMyCourses = GetMyCourses;
const GetAllTutors = async (req, res) => {
    try {
        // Only admins can get all tutors
        if (req.user.type !== "admin" || req.user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied' }
            });
        }
        const tutors = await DB_Config_1.default.admin.findMany({
            where: { role: "Tutor" },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        createdCourses: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json({
            success: true,
            data: { tutors }
        });
    }
    catch (error) {
        console.error('GetAllTutors error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetAllTutors = GetAllTutors;
const GetCourseById = async (req, res) => {
    try {
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
        const avgRating = await DB_Config_1.default.review.aggregate({
            where: { courseId: course.id },
            _avg: { rating: true }
        });
        let isEnrolled = false;
        if (req.user) {
            const enrollment = await DB_Config_1.default.enrollment.findUnique({
                where: {
                    studentId_courseId: {
                        studentId: req.user.id,
                        courseId: course.id
                    }
                }
            });
            isEnrolled = !!enrollment;
        }
        return res.json({
            success: true,
            data: {
                course: {
                    ...course,
                    averageRating: avgRating._avg.rating || 0,
                    isEnrolled
                }
            }
        });
    }
    catch (error) {
        console.error('GetCourseById error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetCourseById = GetCourseById;
const CreateCourse = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors.array() }
            });
        }
        const { title, description, price = 0, duration, level, categoryId, thumbnail, tutorName, tutorId, objectives = [], requirements = [], tags = [] } = req.body;
        // If tutorId is provided, verify it's a valid tutor
        if (tutorId) {
            const tutor = await DB_Config_1.default.admin.findUnique({
                where: { id: tutorId }
            });
            if (!tutor || tutor.role !== "Tutor") {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Invalid tutor ID' }
                });
            }
        }
        const course = await DB_Config_1.default.course.create({
            data: {
                title,
                description,
                price: parseFloat(price),
                duration: duration ? parseInt(duration) : null,
                level,
                ...(categoryId && { categoryId }),
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
                        avatar: true,
                        email: true
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
        return res.status(201).json({
            success: true,
            data: { course }
        });
    }
    catch (error) {
        console.error('CreateCourse error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.CreateCourse = CreateCourse;
const UpdateCourse = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors.array() }
            });
        }
        const { id } = req.params;
        const updates = {};
        const { title, description, price, duration, level, categoryId, thumbnail, tutorName, tutorId, status, isPublic } = req.body;
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
        if (tutorId !== undefined)
            updates.tutorId = tutorId;
        if (status)
            updates.status = status;
        if (typeof isPublic === 'boolean')
            updates.isPublic = isPublic;
        // If tutorId is provided, verify it's a valid tutor
        if (tutorId) {
            const tutor = await DB_Config_1.default.admin.findUnique({
                where: { id: tutorId }
            });
            if (!tutor || tutor.role !== "Tutor") {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Invalid tutor ID' }
                });
            }
        }
        const existingCourse = await DB_Config_1.default.course.findUnique({
            where: { id }
        });
        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                error: { message: 'Course not found' }
            });
        }
        if (existingCourse.creatorId !== req.user.id && req.user.role !== "Admin") {
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
        return res.json({
            success: true,
            data: { course }
        });
    }
    catch (error) {
        console.error('UpdateCourse error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UpdateCourse = UpdateCourse;
const PublishCourse = async (req, res) => {
    try {
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
        if (course.creatorId !== req.user.id && req.user.role !== "Admin") {
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
        return res.json({
            success: true,
            data: {
                course: updatedCourse,
                message: 'Course published successfully!'
            }
        });
    }
    catch (error) {
        console.error('PublishCourse error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.PublishCourse = PublishCourse;
const DeleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await DB_Config_1.default.course.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                thumbnail: true, // Explicitly select thumbnail for deletion
                creatorId: true,
                materials: {
                    select: {
                        id: true,
                        fileUrl: true,
                        type: true
                    }
                },
                enrollments: {
                    select: {
                        id: true,
                        status: true,
                        progressPercentage: true
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
        if (course.creatorId !== req.user.id && req.user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                error: { message: 'Not authorized to delete this course' }
            });
        }
        // Check for active enrollments (not completed)
        const activeEnrollments = course.enrollments.filter(enrollment => enrollment.status !== client_1.EnrollmentStatus.COMPLETED && enrollment.progressPercentage < 100);
        if (activeEnrollments.length > 0) {
            return res.status(400).json({
                success: false,
                error: { message: `Cannot delete course with ${activeEnrollments.length} active enrollment(s). Wait for students to complete the course or manually mark enrollments as completed.` }
            });
        }
        // Delete all associated material files from CDN
        const materialFileUrls = course.materials
            .filter(material => material.fileUrl && material.type !== 'LINK')
            .map(material => material.fileUrl);
        let deletedFilesCount = 0;
        for (const fileUrl of materialFileUrls) {
            const deleted = await (0, CDN_management_1.Delete_File)('materials', fileUrl);
            if (deleted)
                deletedFilesCount++;
        }
        console.log(`🗑️ Deleted ${deletedFilesCount} material files for course: ${course.title}`);
        // Delete course thumbnail from CDN if it exists
        if (course.thumbnail) {
            const thumbnailDeleted = await (0, CDN_management_1.Delete_File)('images', course.thumbnail);
            console.log(`🖼️ Course thumbnail deletion: ${thumbnailDeleted ? 'SUCCESS' : 'FAILED'} - ${course.thumbnail}`);
        }
        else {
            console.log(`📝 No thumbnail to delete for course: ${course.title}`);
        }
        await DB_Config_1.default.course.delete({
            where: { id }
        });
        return res.json({
            success: true,
            message: 'Course and all associated files deleted successfully'
        });
    }
    catch (error) {
        console.error('DeleteCourse error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.DeleteCourse = DeleteCourse;
// ===== CATEGORY CONTROLLERS =====
const GetAllCategories = async (req, res) => {
    try {
        const categories = await DB_Config_1.default.category.findMany({
            include: {
                _count: {
                    select: { courses: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        return res.json({
            success: true,
            data: { categories }
        });
    }
    catch (error) {
        console.error('GetAllCategories error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetAllCategories = GetAllCategories;
const GetCategoryById = async (req, res) => {
    try {
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
        return res.json({
            success: true,
            data: { category }
        });
    }
    catch (error) {
        console.error('GetCategoryById error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetCategoryById = GetCategoryById;
const CreateCategory = async (req, res) => {
    try {
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
        return res.status(201).json({
            success: true,
            data: { category }
        });
    }
    catch (error) {
        console.error('CreateCategory error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.CreateCategory = CreateCategory;
const UpdateCategory = async (req, res) => {
    try {
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
        return res.json({
            success: true,
            data: { category }
        });
    }
    catch (error) {
        console.error('UpdateCategory error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UpdateCategory = UpdateCategory;
const DeleteCategory = async (req, res) => {
    try {
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
        return res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    }
    catch (error) {
        console.error('DeleteCategory error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.DeleteCategory = DeleteCategory;
// ===== MODULE CONTROLLERS =====
const GetCourseModules = async (req, res) => {
    try {
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
        if (course.creatorId !== userId && userRole !== "Admin") {
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
        return res.json({
            success: true,
            data: { modules }
        });
    }
    catch (error) {
        console.error('GetCourseModules error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetCourseModules = GetCourseModules;
const GetModuleById = async (req, res) => {
    try {
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
        if (module.course.creatorId !== userId && userRole !== "Admin") {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied' }
            });
        }
        return res.json({
            success: true,
            data: { module }
        });
    }
    catch (error) {
        console.error('GetModuleById error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetModuleById = GetModuleById;
const CreateModule = async (req, res) => {
    try {
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
        if (course.creatorId !== userId && userRole !== "Admin") {
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
        return res.status(201).json({
            success: true,
            data: { module }
        });
    }
    catch (error) {
        console.error('CreateModule error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.CreateModule = CreateModule;
const UpdateModule = async (req, res) => {
    try {
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
        if (existingModule.course.creatorId !== userId && userRole !== "Admin") {
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
        return res.json({
            success: true,
            data: { module }
        });
    }
    catch (error) {
        console.error('UpdateModule error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UpdateModule = UpdateModule;
const DeleteModule = async (req, res) => {
    try {
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
        if (module.course.creatorId !== userId && userRole !== "Admin") {
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
        return res.json({
            success: true,
            message: 'Module deleted successfully'
        });
    }
    catch (error) {
        console.error('DeleteModule error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.DeleteModule = DeleteModule;
const ReorderModule = async (req, res) => {
    try {
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
        if (module.course.creatorId !== userId && userRole !== "Admin") {
            return res.status(403).json({
                success: false,
                error: { message: 'Not authorized to reorder this module' }
            });
        }
        const updatedModule = await DB_Config_1.default.courseModule.update({
            where: { id },
            data: { orderIndex: parseInt(newOrderIndex) }
        });
        return res.json({
            success: true,
            data: { module: updatedModule }
        });
    }
    catch (error) {
        console.error('ReorderModule error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.ReorderModule = ReorderModule;
// ===== MATERIAL CONTROLLERS =====
const GetCourseMaterials = async (req, res) => {
    try {
        const { courseId } = req.params;
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
        return res.json({
            success: true,
            data: { materials }
        });
    }
    catch (error) {
        console.error('GetCourseMaterials error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetCourseMaterials = GetCourseMaterials;
const GetMaterialById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
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
        await DB_Config_1.default.progress.upsert({
            where: {
                studentId_courseId_materialId: {
                    studentId: userId,
                    courseId: material.courseId,
                    materialId: material.id
                }
            },
            update: {
                lastAccessed: new Date(),
                timeSpent: { increment: 1 }
            },
            create: {
                studentId: userId,
                courseId: material.courseId,
                materialId: material.id,
                lastAccessed: new Date(),
                timeSpent: 1
            }
        });
        return res.json({
            success: true,
            data: { material }
        });
    }
    catch (error) {
        console.error('GetMaterialById error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetMaterialById = GetMaterialById;
const CreateMaterial = async (req, res) => {
    try {
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
        if (course.creatorId !== req.user.id && req.user.role !== "Admin") {
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
        return res.status(201).json({
            success: true,
            data: { material }
        });
    }
    catch (error) {
        console.error('CreateMaterial error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.CreateMaterial = CreateMaterial;
const UpdateMaterial = async (req, res) => {
    try {
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
        if (existingMaterial.course.creatorId !== req.user.id && req.user.role !== "Admin") {
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
        return res.json({
            success: true,
            data: { material }
        });
    }
    catch (error) {
        console.error('UpdateMaterial error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UpdateMaterial = UpdateMaterial;
const DeleteMaterial = async (req, res) => {
    try {
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
        if (material.course.creatorId !== req.user.id && req.user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                error: { message: 'Not authorized to delete this material' }
            });
        }
        // Delete the file from CDN if it exists
        if (material.fileUrl && material.type !== 'LINK') {
            await (0, CDN_management_1.Delete_File)('materials', material.fileUrl);
        }
        // Delete the material from database
        await DB_Config_1.default.material.delete({
            where: { id }
        });
        return res.json({
            success: true,
            message: 'Material and associated file deleted successfully'
        });
    }
    catch (error) {
        console.error('DeleteMaterial error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.DeleteMaterial = DeleteMaterial;
const CompleteMaterial = async (req, res) => {
    try {
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
                studentId_courseId: {
                    studentId: userId,
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
                studentId_courseId_materialId: {
                    studentId: userId,
                    courseId: material.courseId,
                    materialId: material.id
                }
            },
            update: {
                isCompleted: true,
                lastAccessed: new Date()
            },
            create: {
                studentId: userId,
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
                studentId: userId,
                courseId: material.courseId,
                isCompleted: true
            }
        });
        const progressPercentage = totalMaterials > 0
            ? Math.min(100, Math.round((completedMaterials / totalMaterials) * 100))
            : 0;
        await DB_Config_1.default.enrollment.update({
            where: {
                studentId_courseId: {
                    studentId: userId,
                    courseId: material.courseId
                }
            },
            data: {
                progressPercentage,
                ...(progressPercentage === 100 && { completedAt: new Date() })
            }
        });
        return res.json({
            success: true,
            data: {
                progressPercentage,
                isCompleted: true
            }
        });
    }
    catch (error) {
        console.error('CompleteMaterial error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.CompleteMaterial = CompleteMaterial;
// ===== ENROLLMENT CONTROLLERS =====
const EnrollInCourse = async (req, res) => {
    try {
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
        if (!course.isPublic || course.status !== client_1.CourseStatus.PUBLISHED) {
            return res.status(400).json({
                success: false,
                error: { message: 'Course is not available for enrollment' }
            });
        }
        const existingEnrollment = await DB_Config_1.default.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: userId,
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
                studentId: userId,
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
        return res.status(201).json({
            success: true,
            data: { enrollment }
        });
    }
    catch (error) {
        console.error('EnrollInCourse error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.EnrollInCourse = EnrollInCourse;
const GetMyEnrollments = async (req, res) => {
    try {
        const userId = req.user.id;
        const enrollments = await DB_Config_1.default.enrollment.findMany({
            where: { studentId: userId },
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
                    studentId: userId,
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
        return res.json({
            success: true,
            data: { enrollments: enrollmentsWithProgress }
        });
    }
    catch (error) {
        console.error('GetMyEnrollments error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetMyEnrollments = GetMyEnrollments;
const GetCourseStudents = async (req, res) => {
    try {
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
        if (course.creatorId !== userId && userRole !== "Admin") {
            return res.status(403).json({
                success: false,
                error: { message: 'Not authorized to view course students' }
            });
        }
        const enrollments = await DB_Config_1.default.enrollment.findMany({
            where: { courseId },
            include: {
                student: {
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
                    studentId: enrollment.studentId,
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
        return res.json({
            success: true,
            data: { students: studentsWithProgress }
        });
    }
    catch (error) {
        console.error('GetCourseStudents error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetCourseStudents = GetCourseStudents;
const UpdateEnrollmentStatus = async (req, res) => {
    try {
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
        const canModify = enrollment.studentId === userId ||
            enrollment.course.creatorId === userId ||
            req.user.role === "Admin";
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
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        return res.json({
            success: true,
            data: { enrollment: updatedEnrollment }
        });
    }
    catch (error) {
        console.error('UpdateEnrollmentStatus error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UpdateEnrollmentStatus = UpdateEnrollmentStatus;
const GetEnrollmentProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
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
                    studentId: userId,
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
        return res.json({
            success: true,
            data: {
                enrollment,
                materials: materialsWithProgress,
                stats: {
                    totalMaterials,
                    completedMaterials,
                    progressPercentage: totalMaterials > 0 ? Math.min(100, Math.round((completedMaterials / totalMaterials) * 100)) : 0,
                    totalTimeSpent
                }
            }
        });
    }
    catch (error) {
        console.error('GetEnrollmentProgress error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetEnrollmentProgress = GetEnrollmentProgress;
const DeleteEnrollment = async (req, res) => {
    try {
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
        const canDelete = enrollment.studentId === userId ||
            enrollment.course.creatorId === userId ||
            req.user.role === "Admin";
        if (!canDelete) {
            return res.status(403).json({
                success: false,
                error: { message: 'Not authorized to delete this enrollment' }
            });
        }
        await DB_Config_1.default.enrollment.delete({
            where: { id: enrollmentId }
        });
        return res.json({
            success: true,
            message: 'Enrollment cancelled successfully'
        });
    }
    catch (error) {
        console.error('DeleteEnrollment error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.DeleteEnrollment = DeleteEnrollment;
// ===== UPLOAD CONTROLLERS =====
// Note: File upload middleware configuration would be set up separately in the route file
const UploadSingleFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No file uploaded' }
            });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        return res.json({
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
    }
    catch (error) {
        console.error('UploadSingleFile error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UploadSingleFile = UploadSingleFile;
const UploadMultipleFiles = async (req, res) => {
    try {
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
        return res.json({
            success: true,
            data: { files: uploadedFiles }
        });
    }
    catch (error) {
        console.error('UploadMultipleFiles error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UploadMultipleFiles = UploadMultipleFiles;
const UploadAvatar = async (req, res) => {
    try {
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
        const currentUser = await DB_Config_1.default.admin.findUnique({
            where: { id: req.user.id },
            select: { avatar: true }
        });
        // Delete old avatar if it exists
        if (currentUser?.avatar) {
            (0, fileUtils_1.deleteUploadedFile)(currentUser.avatar);
        }
        await DB_Config_1.default.admin.update({
            where: { id: req.user.id },
            data: { avatar: avatarUrl }
        });
        return res.json({
            success: true,
            data: {
                filename: req.file.filename,
                url: avatarUrl,
                message: 'Avatar updated successfully'
            }
        });
    }
    catch (error) {
        console.error('UploadAvatar error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UploadAvatar = UploadAvatar;
const UploadCourseThumbnail = async (req, res) => {
    try {
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
        // Upload file to CDN in images folder
        const thumbnailUrl = await (0, CDN_management_1.Upload_Files)('images', req.file);
        if (!thumbnailUrl) {
            return res.status(500).json({
                success: false,
                error: { message: 'Failed to upload thumbnail to CDN' }
            });
        }
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
            if (course.creatorId !== req.user.id && req.user.role !== "Admin") {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Not authorized to update this course' }
                });
            }
            // Get current course to check for existing thumbnail
            const currentCourse = await DB_Config_1.default.course.findUnique({
                where: { id: courseId },
                select: { thumbnail: true }
            });
            // Delete old thumbnail from CDN if it exists
            if (currentCourse?.thumbnail) {
                await (0, CDN_management_1.Delete_File)('images', currentCourse.thumbnail);
            }
            await DB_Config_1.default.course.update({
                where: { id: courseId },
                data: { thumbnail: thumbnailUrl }
            });
            return res.json({
                success: true,
                data: {
                    filename: req.file.originalname,
                    url: thumbnailUrl,
                    message: 'Course thumbnail updated successfully'
                }
            });
        }
        else {
            return res.json({
                success: true,
                data: {
                    filename: req.file.originalname,
                    url: thumbnailUrl
                }
            });
        }
    }
    catch (error) {
        console.error('UploadCourseThumbnail error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UploadCourseThumbnail = UploadCourseThumbnail;
const UploadMaterial = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No material file uploaded' }
            });
        }
        const { courseId } = req.body;
        // Log file details for debugging
        const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
        console.log(`📦 Processing upload: ${req.file.originalname} (${fileSizeMB} MB)`);
        // Choose storage method based on environment
        let fileUrl = null;
        if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_STORAGE === 'true') {
            // Use local storage for development
            console.log('📂 Using local storage for development');
            fileUrl = await (0, localStorage_1.Upload_Files_Local)('materials', req.file);
        }
        else {
            // Use Bunny CDN for production or when explicitly configured
            console.log('☁️ Using Bunny CDN storage');
            fileUrl = req.file.size > 20 * 1024 * 1024
                ? await (0, CDN_streaming_1.Upload_Files_Stream)('materials', req.file)
                : await (0, CDN_management_1.Upload_Files)('materials', req.file);
        }
        if (!fileUrl) {
            return res.status(500).json({
                success: false,
                error: { message: 'Failed to upload material to CDN' }
            });
        }
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
            if (course.creatorId !== req.user.id && req.user.role !== "Admin") {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Not authorized to upload materials for this course' }
                });
            }
        }
        return res.json({
            success: true,
            data: {
                filename: req.file.originalname,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                fileUrl: fileUrl,
                url: fileUrl
            }
        });
    }
    catch (error) {
        console.error('UploadMaterial error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.UploadMaterial = UploadMaterial;
const DeleteUploadedFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const filePath = path_1.default.join(uploadDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: { message: 'File not found' }
            });
        }
        try {
            fs_1.default.unlinkSync(filePath);
            return res.json({
                success: true,
                message: 'File deleted successfully'
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: { message: 'Failed to delete file' }
            });
        }
    }
    catch (error) {
        console.error('DeleteUploadedFile error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.DeleteUploadedFile = DeleteUploadedFile;
const GetFileInfo = async (req, res) => {
    try {
        const { filename } = req.params;
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const filePath = path_1.default.join(uploadDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: { message: 'File not found' }
            });
        }
        const stats = fs_1.default.statSync(filePath);
        const extension = path_1.default.extname(filename);
        return res.json({
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
    }
    catch (error) {
        console.error('GetFileInfo error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    }
};
exports.GetFileInfo = GetFileInfo;
// ===== ANALYTICS CONTROLLERS =====
const GetTutorAnalytics = async (req, res) => {
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
                    select: {
                        id: true,
                        studentId: true,
                        courseId: true,
                        status: true,
                        progressPercentage: true,
                        enrolledAt: true,
                        completedAt: true
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
            // Calculate completion rate for this course based on progressPercentage
            let completionRate = 0;
            if (studentCount > 0) {
                const totalProgressPercentage = course.enrollments.reduce((sum, enrollment) => {
                    return sum + enrollment.progressPercentage;
                }, 0);
                completionRate = totalProgressPercentage / studentCount;
            }
            totalMaterials += materialCount * studentCount;
            const courseCompletedMaterials = course.enrollments.reduce((sum, enrollment) => {
                return sum + Math.floor((enrollment.progressPercentage / 100) * materialCount);
            }, 0);
            totalCompletedMaterials += courseCompletedMaterials;
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
                published: courses.filter(c => c.status === client_1.CourseStatus.PUBLISHED).length,
                draft: courses.filter(c => c.status === client_1.CourseStatus.DRAFT).length,
                archived: courses.filter(c => c.status === client_1.CourseStatus.ARCHIVED).length
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
        return res.json({
            success: true,
            data: {
                analytics,
                courseAnalytics,
                revenueData
            }
        });
    }
    catch (error) {
        console.error('GetTutorAnalytics error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch analytics data' }
        });
    }
};
exports.GetTutorAnalytics = GetTutorAnalytics;
const GetCourseCompletion = async (req, res) => {
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
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
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
            const completionRate = enrollment.progressPercentage;
            const completedMaterials = Math.floor((completionRate / 100) * materialCount);
            return {
                studentId: enrollment.studentId,
                studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
                completedMaterials,
                totalMaterials: materialCount,
                completionRate: Math.round(completionRate * 100) / 100
            };
        });
        return res.json({
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
        console.error('GetCourseCompletion error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch course completion data' }
        });
    }
};
exports.GetCourseCompletion = GetCourseCompletion;
// ===== STUDENT ASSIGNMENT CONTROLLERS =====
/**
 * Get assignments for enrolled course (student view)
 */
const GetStudentCourseAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;
        // Verify enrollment
        const enrollment = await DB_Config_1.default.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId,
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
                        feedback: true,
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
exports.GetStudentCourseAssignments = GetStudentCourseAssignments;
/**
 * Submit assignment (student)
 */
const SubmitAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { content, fileUrl } = req.body;
        const studentId = req.user.id;
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
                    completedItems: completedItems
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
exports.SubmitAssignment = SubmitAssignment;
/**
 * Get assignment submission (student view)
 */
const GetStudentSubmission = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const studentId = req.user.id;
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
                        description: true,
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
exports.GetStudentSubmission = GetStudentSubmission;
/**
 * Upload assignment file (student)
 */
const UploadAssignmentFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No assignment file uploaded' }
            });
        }
        let fileUrl = null;
        // Check environment: use local storage for development, CDN for production
        if (process.env.NODE_ENV === 'development' || !process.env.BUNNY_API_KEY) {
            // Use local storage for development
            console.log('📂 Using local storage for development');
            fileUrl = await (0, localStorage_1.Upload_Files_Local)('assignments', req.file);
        }
        else {
            // Use Bunny CDN for production or when explicitly configured
            console.log('☁️ Using Bunny CDN storage for assignments');
            fileUrl = req.file.size > 20 * 1024 * 1024
                ? await (0, CDN_streaming_1.Upload_Files_Stream)('assignments', req.file)
                : await (0, CDN_management_1.Upload_Files)('assignments', req.file);
        }
        if (!fileUrl) {
            return res.status(500).json({
                success: false,
                error: { message: 'Failed to upload assignment file to storage' }
            });
        }
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
        console.error('Upload assignment file error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to upload assignment file.' }
        });
    }
};
exports.UploadAssignmentFile = UploadAssignmentFile;
