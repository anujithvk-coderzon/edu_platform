"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// Import middleware
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
// Import multer configuration
const multer_1 = require("../multer/multer");
// Import CDN utilities (only needed for imports, actual CDN logic is in controllers now)
// Import controller functions
const adminController_1 = require("../controller/adminController");
// Import assignment controllers
const assignmentController_1 = require("../controller/assignmentController");
const router = express_1.default.Router();
// ===== AUTH ROUTES =====
// Bootstrap admin (first admin creation)
router.post('/auth/bootstrap-admin', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
], (0, errorHandler_1.asyncHandler)(adminController_1.BootstrapAdmin));
// Admin registration (create new tutor)
router.post('/auth/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('role').optional().isIn(['Admin', 'Tutor']).withMessage('Role must be either Admin or Tutor'),
], (0, errorHandler_1.asyncHandler)(adminController_1.RegisterUser));
// Create tutor by admin
router.post('/auth/create-tutor', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
], adminController_1.RegisterTutor);
// Admin login
router.post('/auth/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty(),
], (0, errorHandler_1.asyncHandler)(adminController_1.LoginUser));
// Admin logout
router.post('/auth/logout', auth_1.authMiddleware, (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('admin_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/'
    });
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
// ===== PUBLIC TUTOR REGISTRATION ROUTES (No Auth Required) =====
// Check if tutor email is available
router.post('/auth/tutor/check-email', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
], (0, errorHandler_1.asyncHandler)(adminController_1.CheckTutorEmail));
// Send verification email to tutor
router.post('/auth/tutor/verify-email', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
], (0, errorHandler_1.asyncHandler)(adminController_1.SendTutorVerificationEmail));
// Verify tutor OTP
router.post('/auth/tutor/verify-otp', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('otp').isString().isLength({ min: 6, max: 6 }),
], (0, errorHandler_1.asyncHandler)(adminController_1.VerifyTutorOTP));
// Complete tutor registration
router.post('/auth/tutor/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
], (0, errorHandler_1.asyncHandler)(adminController_1.RegisterTutorPublic));
// Forgot password
router.post('/auth/forgot-password', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
], (0, errorHandler_1.asyncHandler)(adminController_1.AdminForgotPassword));
// Verify forgot password OTP
router.post('/auth/verify-forgot-password-otp', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('otp').trim().isLength({ min: 6, max: 6 }),
], (0, errorHandler_1.asyncHandler)(adminController_1.AdminVerifyForgotPasswordOtp));
// Reset password
router.post('/auth/reset-password', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('otp').trim().isLength({ min: 6, max: 6 }),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }),
], (0, errorHandler_1.asyncHandler)(adminController_1.AdminResetPassword));
// Get current admin
router.get('/auth/me', auth_1.authMiddleware, adminController_1.GetCurrentUser);
// Update admin profile
router.put('/auth/profile', auth_1.authMiddleware, [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('avatar').optional().isURL(),
], adminController_1.UpdateProfile);
// Change password
router.put('/auth/change-password', auth_1.authMiddleware, [
    (0, express_validator_1.body)('currentPassword').notEmpty(),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }),
], adminController_1.ChangePassword);
// ===== USER/STUDENT MANAGEMENT ROUTES =====
// Get students count
router.get('/students/count', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.GetStudentsCount);
// Get all registered students (from Student table directly)
router.get('/students/registered', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.GetAllRegisteredStudents);
// Get all students
router.get('/students', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('search').optional().isString(),
], adminController_1.GetAllStudents);
// Get student/user by ID
router.get('/students/:id', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.GetUserById);
// Block student
router.put('/students/:studentId/block', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.BlockStudent);
// Unblock student
router.put('/students/:studentId/unblock', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.UnblockStudent);
// Update student/user
router.put('/students/:id', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('role').optional().isIn(['ADMIN', 'STUDENT']),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
    (0, express_validator_1.body)('isVerified').optional().isBoolean(),
], adminController_1.UpdateUser);
// Delete student/user
router.delete('/students/:id', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.DeleteUser);
// Get user statistics
router.get('/students/stats/overview', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.GetUserStats);
// ===== TUTOR REQUEST MANAGEMENT ROUTES =====
// Get pending tutor requests count
router.get('/tutor-requests/count', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.GetPendingTutorRequestsCount);
// Get all tutor requests
router.get('/tutor-requests', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.query)('status').optional().isIn(['PENDING', 'ACCEPTED', 'REJECTED']),
], adminController_1.GetAllTutorRequests);
// Accept tutor request
router.post('/tutor-requests/:requestId/accept', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.AcceptTutorRequest);
// Reject tutor request
router.post('/tutor-requests/:requestId/reject', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.RejectTutorRequest);
// ===== COURSE MANAGEMENT ROUTES =====
// Get all courses (admin view)
router.get('/courses', auth_1.authMiddleware, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('category').optional().isString(),
    (0, express_validator_1.query)('level').optional().isString(),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
], adminController_1.GetAllCourses);
// Get my courses
router.get('/courses/my-courses', auth_1.authMiddleware, adminController_1.GetMyCourses);
// Get pending courses count (Admin only) - Must be before /courses/:id
router.get('/courses/pending/count', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.GetPendingCoursesCount);
// Get all pending courses (Admin only) - Must be before /courses/:id
router.get('/courses/pending', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.GetPendingCourses);
// Get all tutors
router.get('/tutors', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.GetAllTutors);
// Toggle tutor status
router.put('/admin/tutors/:id/status', auth_1.authMiddleware, auth_1.adminOnly, [(0, express_validator_1.body)('isActive').isBoolean()], adminController_1.ToggleTutorStatus);
// Get course by ID
router.get('/courses/:id', auth_1.authMiddleware, adminController_1.GetCourseById);
// Create course
router.post('/courses', auth_1.authMiddleware, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').trim().isLength({ min: 10 }),
    (0, express_validator_1.body)('price').optional().isNumeric(),
    (0, express_validator_1.body)('duration').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('level').optional().isString(),
    (0, express_validator_1.body)('categoryId').optional().isUUID(),
    (0, express_validator_1.body)('thumbnail').optional().custom((value) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
            const urlRegex = /^(https?:\/\/.+|\/uploads\/.+|images\/.+|avatars\/.+|materials\/.+)$/;
            if (!urlRegex.test(value)) {
                throw new Error('Thumbnail must be a valid URL');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('tutorName').optional().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('objectives').optional().isArray(),
    (0, express_validator_1.body)('requirements').optional().isArray(),
    (0, express_validator_1.body)('tags').optional().isArray(),
], adminController_1.CreateCourse);
// Update course
router.put('/courses/:id', auth_1.authMiddleware, [
    (0, express_validator_1.param)('id').isLength({ min: 1 }).withMessage('Course ID is required'),
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('price').optional().isNumeric(),
    (0, express_validator_1.body)('duration').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('level').optional().isString(),
    (0, express_validator_1.body)('categoryId').optional().isUUID(),
    (0, express_validator_1.body)('thumbnail').optional().custom((value) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
            const urlRegex = /^(https?:\/\/.+|\/uploads\/.+|images\/.+|avatars\/.+|materials\/.+)$/;
            if (!urlRegex.test(value)) {
                throw new Error('Thumbnail must be a valid URL');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('tutorName').optional().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    (0, express_validator_1.body)('isPublic').optional().isBoolean(),
], adminController_1.UpdateCourse);
// Submit course for review (Tutor only)
router.put('/courses/:id/submit-review', auth_1.authMiddleware, adminController_1.SubmitCourseForReview);
// Publish course (Admin only)
router.put('/courses/:id/publish', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.PublishCourse);
// Reject course (Admin only)
router.put('/courses/:id/reject', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.RejectCourse);
// Delete course
router.delete('/courses/:id', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.DeleteCourse);
// Cleanup orphaned courses
router.post('/courses/cleanup', auth_1.authMiddleware, adminController_1.CleanupOrphanedCourses);
// ===== CATEGORY MANAGEMENT ROUTES =====
// Get all categories
router.get('/categories', (0, errorHandler_1.asyncHandler)(adminController_1.GetAllCategories));
// Get category by ID
router.get('/categories/:id', (0, errorHandler_1.asyncHandler)(adminController_1.GetCategoryById));
// Create category
router.post('/categories', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.body)('name').trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 500 }),
], adminController_1.CreateCategory);
// Update category
router.put('/categories/:id', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.param)('id').isUUID(),
    (0, express_validator_1.body)('name').optional().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 500 }),
], adminController_1.UpdateCategory);
// Delete category
router.delete('/categories/:id', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.DeleteCategory);
// ===== MODULE MANAGEMENT ROUTES =====
// Get course modules
router.get('/modules/course/:courseId', auth_1.authMiddleware, adminController_1.GetCourseModules);
// Get module by ID
router.get('/modules/:id', auth_1.authMiddleware, adminController_1.GetModuleById);
// Create module
router.post('/modules', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 1000 }),
    (0, express_validator_1.body)('orderIndex').isInt({ min: 0 }),
    (0, express_validator_1.body)('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
], adminController_1.CreateModule);
// Update module
router.put('/modules/:id', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.param)('id').isLength({ min: 1 }).withMessage('Module ID is required'),
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 1000 }),
    (0, express_validator_1.body)('orderIndex').optional().isInt({ min: 0 }),
], adminController_1.UpdateModule);
// Delete module
router.delete('/modules/:id', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.DeleteModule);
// Reorder module
router.put('/modules/:id/reorder', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.param)('id').isLength({ min: 1 }).withMessage('Module ID is required'),
    (0, express_validator_1.body)('newOrderIndex').isInt({ min: 0 }),
], adminController_1.ReorderModule);
// ===== MATERIAL MANAGEMENT ROUTES =====
// Get course materials
router.get('/materials/course/:courseId', auth_1.authMiddleware, adminController_1.GetCourseMaterials);
// Get material by ID
router.get('/materials/:id', auth_1.authMiddleware, adminController_1.GetMaterialById);
// Create material
router.post('/materials', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('type').isIn(['PDF', 'VIDEO', 'LINK']),
    (0, express_validator_1.body)('fileUrl').optional().custom((value) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
            // Allow URLs, paths, and GUIDs (for Bunny Stream videos)
            const urlRegex = /^(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\/][^\s]*|images\/.+|avatars\/.+|materials\/.+|uploads\/.+|videos\/.+|audios\/.+|documents\/.+|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
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
], adminController_1.CreateMaterial);
// Update material
router.put('/materials/:id', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.param)('id').isLength({ min: 1 }).withMessage('Material ID is required'),
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('type').optional().isIn(['PDF', 'VIDEO', 'LINK']),
    (0, express_validator_1.body)('fileUrl').optional().custom((value) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
            // Allow URLs, paths, and GUIDs (for Bunny Stream videos)
            const urlRegex = /^(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\/][^\s]*|images\/.+|avatars\/.+|materials\/.+|uploads\/.+|videos\/.+|audios\/.+|documents\/.+|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
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
], adminController_1.UpdateMaterial);
// Delete material
router.delete('/materials/:id', auth_1.authMiddleware, auth_1.adminOnly, adminController_1.DeleteMaterial);
// Complete material (for progress tracking)
router.post('/materials/:id/complete', auth_1.authMiddleware, adminController_1.CompleteMaterial);
// ===== ENROLLMENT MANAGEMENT ROUTES =====
// Enroll in course
router.post('/enrollments/enroll', auth_1.authMiddleware, [
    (0, express_validator_1.body)('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
], adminController_1.EnrollInCourse);
// Get my enrollments
router.get('/enrollments/my-enrollments', auth_1.authMiddleware, adminController_1.GetMyEnrollments);
// Get course students
router.get('/enrollments/course/:courseId/students', auth_1.authMiddleware, adminController_1.GetCourseStudents);
// Update enrollment status
router.put('/enrollments/:enrollmentId/status', auth_1.authMiddleware, [
    (0, express_validator_1.param)('enrollmentId').isLength({ min: 1 }).withMessage('Enrollment ID is required'),
    (0, express_validator_1.body)('status').isIn(['ACTIVE', 'COMPLETED', 'DROPPED']),
], adminController_1.UpdateEnrollmentStatus);
// Get enrollment progress
router.get('/enrollments/progress/:courseId', auth_1.authMiddleware, adminController_1.GetEnrollmentProgress);
// Delete enrollment
router.delete('/enrollments/:enrollmentId', auth_1.authMiddleware, adminController_1.DeleteEnrollment);
// ===== UPLOAD ROUTES =====
// Single file upload
router.post('/uploads/single', auth_1.authMiddleware, multer_1.upload.single('file'), (0, errorHandler_1.asyncHandler)(adminController_1.UploadSingleFile));
// Multiple file upload
router.post('/uploads/multiple', auth_1.authMiddleware, multer_1.upload.array('files', 5), (0, errorHandler_1.asyncHandler)(adminController_1.UploadMultipleFiles));
// Avatar upload with CDN and old avatar deletion
router.post('/uploads/avatar', auth_1.authMiddleware, multer_1.upload_avatar, (0, errorHandler_1.asyncHandler)(adminController_1.UploadAdminAvatar));
// Course thumbnail upload
router.post('/uploads/course-thumbnail', auth_1.authMiddleware, multer_1.upload.single('thumbnail'), (0, errorHandler_1.asyncHandler)(adminController_1.UploadCourseThumbnail));
// Material upload
router.post('/uploads/material', auth_1.authMiddleware, multer_1.upload.single('file'), (0, errorHandler_1.asyncHandler)(adminController_1.UploadMaterial));
// Delete file
router.delete('/uploads/file/:filename', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(adminController_1.DeleteUploadedFile));
// Get file info
router.get('/uploads/file-info/:filename', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(adminController_1.GetFileInfo));
// ===== ANALYTICS ROUTES =====
// Get tutor analytics
router.get('/analytics/tutor', auth_1.authMiddleware, adminController_1.GetTutorAnalytics);
// Get course completion analytics
router.get('/analytics/course/:courseId/completion', auth_1.authMiddleware, adminController_1.GetCourseCompletion);
// ===== ASSIGNMENT ROUTES =====
// Create assignment
router.post('/assignments', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
    (0, express_validator_1.body)('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
    (0, express_validator_1.body)('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
    (0, express_validator_1.body)('maxScore').optional().isFloat({ min: 0 }).withMessage('Max score must be a positive number'),
    (0, express_validator_1.body)('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
], assignmentController_1.CreateAssignment);
// Get assignments for a course
router.get('/assignments/course/:courseId', auth_1.authMiddleware, assignmentController_1.GetCourseAssignments);
// Get assignment by ID
router.get('/assignments/:id', auth_1.authMiddleware, assignmentController_1.GetAssignmentById);
// Update assignment
router.put('/assignments/:id', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.param)('id').isLength({ min: 1 }).withMessage('Assignment ID is required'),
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
    (0, express_validator_1.body)('maxScore').optional().isFloat({ min: 0 }).withMessage('Max score must be a positive number'),
], assignmentController_1.UpdateAssignment);
// Delete assignment
router.delete('/assignments/:id', auth_1.authMiddleware, auth_1.adminOnly, assignmentController_1.DeleteAssignment);
// Get assignment submissions
router.get('/assignments/:assignmentId/submissions', auth_1.authMiddleware, assignmentController_1.GetAssignmentSubmissions);
// Grade submission
router.put('/assignments/submissions/:submissionId/grade', auth_1.authMiddleware, auth_1.adminOnly, [
    (0, express_validator_1.body)('score').isFloat({ min: 0 }).withMessage('Score must be a positive number'),
    (0, express_validator_1.body)('feedback').optional().trim(),
], assignmentController_1.GradeSubmission);
exports.default = router;
