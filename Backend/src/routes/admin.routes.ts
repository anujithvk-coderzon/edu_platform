import express from 'express';
import { body, query, param } from 'express-validator';

// Import middleware
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, adminOnly } from '../middleware/auth';

// Import multer configuration
import { upload, upload_avatar } from '../multer/multer';

// Import CDN utilities (only needed for imports, actual CDN logic is in controllers now)

// Import controller functions
import {
  // Auth Controllers
  BootstrapAdmin,
  RegisterUser,
  RegisterTutor,
  LoginUser,
  AdminForgotPassword,
  AdminVerifyForgotPasswordOtp,
  AdminResetPassword,
  GetCurrentUser,
  UpdateProfile,
  ChangePassword,

  // User Management Controllers
  GetAllUsers,
  GetUserById,
  UpdateUser,
  DeleteUser,
  GetUserStats,
  GetStudentStats,

  // Tutor Request Management Controllers
  GetPendingTutorRequestsCount,
  GetAllTutorRequests,
  AcceptTutorRequest,
  RejectTutorRequest,

  // Course Management Controllers
  GetAllCourses,
  GetMyCourses,
  GetAllTutors,
  ToggleTutorStatus,
  GetCourseById,
  CreateCourse,
  UpdateCourse,
  SubmitCourseForReview,
  PublishCourse,
  RejectCourse,
  GetPendingCoursesCount,
  GetPendingCourses,
  DeleteCourse,
  CleanupOrphanedCourses,

  // Category Management Controllers
  GetAllCategories,
  GetCategoryById,
  CreateCategory,
  UpdateCategory,
  DeleteCategory,

  // Module Management Controllers
  GetCourseModules,
  GetModuleById,
  CreateModule,
  UpdateModule,
  DeleteModule,
  ReorderModule,

  // Material Management Controllers
  GetCourseMaterials,
  GetMaterialById,
  CreateMaterial,
  UpdateMaterial,
  DeleteMaterial,
  CompleteMaterial,

  // Enrollment Management Controllers
  EnrollInCourse,
  GetMyEnrollments,
  GetCourseStudents,
  UpdateEnrollmentStatus,
  GetEnrollmentProgress,
  DeleteEnrollment,

  // Upload Controllers
  UploadSingleFile,
  UploadMultipleFiles,
  UploadAvatar,
  UploadAdminAvatar,
  UploadCourseThumbnail,
  UploadMaterial,
  DeleteUploadedFile,
  GetFileInfo,

  // Analytics Controllers
  GetTutorAnalytics,
  GetCourseCompletion,

  // Student Management Controllers
  GetStudentsCount,
  GetAllRegisteredStudents,
  GetAllStudents,
  BlockStudent,
  UnblockStudent,

  // Public Tutor Registration Controllers
  CheckTutorEmail,
  SendTutorVerificationEmail,
  VerifyTutorOTP,
  RegisterTutorPublic
} from '../controller/adminController';

// Import assignment controllers
import {
  CreateAssignment,
  GetCourseAssignments,
  GetAssignmentById,
  UpdateAssignment,
  DeleteAssignment,
  GetAssignmentSubmissions,
  GradeSubmission
} from '../controller/assignmentController';

const router = express.Router();

// ===== AUTH ROUTES =====

// Bootstrap admin (first admin creation)
router.post('/auth/bootstrap-admin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
  ],
  asyncHandler(BootstrapAdmin)
);

// Admin registration (create new tutor)
router.post('/auth/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
    body('role').optional().isIn(['Admin', 'Tutor']).withMessage('Role must be either Admin or Tutor'),
  ],
  asyncHandler(RegisterUser)
);

// Create tutor by admin
router.post('/auth/create-tutor', authMiddleware, adminOnly,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
  ],
  RegisterTutor
);

// Admin login
router.post('/auth/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  asyncHandler(LoginUser)
);

// Admin logout
router.post('/auth/logout', authMiddleware, (req, res) => {
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
router.post('/auth/tutor/check-email',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  asyncHandler(CheckTutorEmail)
);

// Send verification email to tutor
router.post('/auth/tutor/verify-email',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  asyncHandler(SendTutorVerificationEmail)
);

// Verify tutor OTP
router.post('/auth/tutor/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isString().isLength({ min: 6, max: 6 }),
  ],
  asyncHandler(VerifyTutorOTP)
);

// Complete tutor registration
router.post('/auth/tutor/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
  ],
  asyncHandler(RegisterTutorPublic)
);

// Forgot password
router.post('/auth/forgot-password',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  asyncHandler(AdminForgotPassword)
);

// Verify forgot password OTP
router.post('/auth/verify-forgot-password-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }),
  ],
  asyncHandler(AdminVerifyForgotPasswordOtp)
);

// Reset password
router.post('/auth/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 }),
  ],
  asyncHandler(AdminResetPassword)
);

// Get current admin
router.get('/auth/me', authMiddleware, GetCurrentUser);

// Update admin profile
router.put('/auth/profile', authMiddleware,
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('avatar').optional().isURL(),
  ],
  UpdateProfile
);

// Change password
router.put('/auth/change-password', authMiddleware,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  ChangePassword
);

// ===== USER/STUDENT MANAGEMENT ROUTES =====

// Get students count
router.get('/students/count', authMiddleware, adminOnly, GetStudentsCount);

// Get all registered students (from Student table directly)
router.get('/students/registered', authMiddleware, adminOnly, GetAllRegisteredStudents);

// Get all students
router.get('/students', authMiddleware, adminOnly,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
  ],
  GetAllStudents
);

// Get student/user by ID
router.get('/students/:id', authMiddleware, adminOnly, GetUserById);

// Block student
router.put('/students/:studentId/block', authMiddleware, adminOnly, BlockStudent);

// Unblock student
router.put('/students/:studentId/unblock', authMiddleware, adminOnly, UnblockStudent);

// Update student/user
router.put('/students/:id', authMiddleware, adminOnly,
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('role').optional().isIn(['ADMIN', 'STUDENT']),
    body('isActive').optional().isBoolean(),
    body('isVerified').optional().isBoolean(),
  ],
  UpdateUser
);

// Delete student/user
router.delete('/students/:id', authMiddleware, adminOnly, DeleteUser);

// Get user statistics (more specific route first)
router.get('/students/stats/overview', authMiddleware, adminOnly, GetUserStats);
router.get('/students/stats/detailed', authMiddleware, adminOnly, GetStudentStats);

// ===== TUTOR REQUEST MANAGEMENT ROUTES =====

// Get pending tutor requests count
router.get('/tutor-requests/count', authMiddleware, adminOnly, GetPendingTutorRequestsCount);

// Get all tutor requests
router.get('/tutor-requests', authMiddleware, adminOnly,
  [
    query('status').optional().isIn(['PENDING', 'ACCEPTED', 'REJECTED']),
  ],
  GetAllTutorRequests
);

// Accept tutor request
router.post('/tutor-requests/:requestId/accept', authMiddleware, adminOnly, AcceptTutorRequest);

// Reject tutor request
router.post('/tutor-requests/:requestId/reject', authMiddleware, adminOnly, RejectTutorRequest);

// ===== COURSE MANAGEMENT ROUTES =====

// Get all courses (admin view)
router.get('/courses', authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('level').optional().isString(),
    query('search').optional().isString(),
    query('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  ],
  GetAllCourses
);

// Get my courses
router.get('/courses/my-courses',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('status').optional().isString()
  ],
  GetMyCourses
);

// Get pending courses count (Admin only) - Must be before /courses/:id
router.get('/courses/pending/count', authMiddleware, adminOnly, GetPendingCoursesCount);

// Get all pending courses (Admin only) - Must be before /courses/:id
router.get('/courses/pending', authMiddleware, adminOnly, GetPendingCourses);

// Get all tutors
router.get('/tutors', authMiddleware, adminOnly, GetAllTutors);

// Toggle tutor status
router.put('/admin/tutors/:id/status', authMiddleware, adminOnly,
  [body('isActive').isBoolean()],
  ToggleTutorStatus
);

// Get course by ID
router.get('/courses/:id', authMiddleware, GetCourseById);

// Create course
router.post('/courses', authMiddleware,
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').trim().isLength({ min: 10 }),
    body('price').optional().isNumeric(),
    body('duration').optional().isInt({ min: 1 }),
    body('level').optional().isString(),
    body('categoryId').optional().isUUID(),
    body('thumbnail').optional().custom((value) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        const urlRegex = /^(https?:\/\/.+|\/uploads\/.+|images\/.+|avatars\/.+|materials\/.+)$/;
        if (!urlRegex.test(value)) {
          throw new Error('Thumbnail must be a valid URL');
        }
      }
      return true;
    }),
    body('tutorName').optional().trim().isLength({ min: 1, max: 100 }),
    body('objectives').optional().isArray(),
    body('requirements').optional().isArray(),
    body('tags').optional().isArray(),
  ],
  CreateCourse
);

// Update course
router.put('/courses/:id', authMiddleware,
  [
    param('id').isLength({ min: 1 }).withMessage('Course ID is required'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ min: 1 }),
    body('price').optional().isNumeric(),
    body('duration').optional().isInt({ min: 1 }),
    body('level').optional().isString(),
    body('categoryId').optional().isUUID(),
    body('thumbnail').optional().custom((value) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        const urlRegex = /^(https?:\/\/.+|\/uploads\/.+|images\/.+|avatars\/.+|materials\/.+)$/;
        if (!urlRegex.test(value)) {
          throw new Error('Thumbnail must be a valid URL');
        }
      }
      return true;
    }),
    body('tutorName').optional().trim().isLength({ min: 1, max: 100 }),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    body('isPublic').optional().isBoolean(),
  ],
  UpdateCourse
);

// Submit course for review (Tutor only)
router.put('/courses/:id/submit-review', authMiddleware, SubmitCourseForReview);

// Publish course (Admin only)
router.put('/courses/:id/publish', authMiddleware, adminOnly, PublishCourse);

// Reject course (Admin only)
router.put('/courses/:id/reject', authMiddleware, adminOnly, RejectCourse);

// Delete course
router.delete('/courses/:id', authMiddleware, adminOnly, DeleteCourse);

// Cleanup orphaned courses
router.post('/courses/cleanup', authMiddleware, CleanupOrphanedCourses);

// ===== CATEGORY MANAGEMENT ROUTES =====

// Get all categories
router.get('/categories', asyncHandler(GetAllCategories));

// Get category by ID
router.get('/categories/:id', asyncHandler(GetCategoryById));

// Create category
router.post('/categories', authMiddleware, adminOnly,
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  CreateCategory
);

// Update category
router.put('/categories/:id', authMiddleware, adminOnly,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  UpdateCategory
);

// Delete category
router.delete('/categories/:id', authMiddleware, adminOnly, DeleteCategory);

// ===== MODULE MANAGEMENT ROUTES =====

// Get course modules
router.get('/modules/course/:courseId', authMiddleware, GetCourseModules);

// Get module by ID
router.get('/modules/:id', authMiddleware, GetModuleById);

// Create module
router.post('/modules', authMiddleware, adminOnly,
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('orderIndex').isInt({ min: 0 }),
    body('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
  ],
  CreateModule
);

// Update module
router.put('/modules/:id', authMiddleware, adminOnly,
  [
    param('id').isLength({ min: 1 }).withMessage('Module ID is required'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('orderIndex').optional().isInt({ min: 0 }),
  ],
  UpdateModule
);

// Delete module
router.delete('/modules/:id', authMiddleware, adminOnly, DeleteModule);

// Reorder module
router.put('/modules/:id/reorder', authMiddleware, adminOnly,
  [
    param('id').isLength({ min: 1 }).withMessage('Module ID is required'),
    body('newOrderIndex').isInt({ min: 0 }),
  ],
  ReorderModule
);

// ===== MATERIAL MANAGEMENT ROUTES =====

// Get course materials
router.get('/materials/course/:courseId', authMiddleware, GetCourseMaterials);

// Get material by ID
router.get('/materials/:id', authMiddleware, GetMaterialById);

// Create material
router.post('/materials', authMiddleware, adminOnly,
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('type').isIn(['PDF', 'VIDEO', 'LINK']),
    body('fileUrl').optional().custom((value) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Allow URLs, paths, and GUIDs (for Bunny Stream videos)
        const urlRegex = /^(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\/][^\s]*|images\/.+|avatars\/.+|materials\/.+|uploads\/.+|videos\/.+|audios\/.+|documents\/.+|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
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
  CreateMaterial
);

// Update material
router.put('/materials/:id', authMiddleware, adminOnly,
  [
    param('id').isLength({ min: 1 }).withMessage('Material ID is required'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('type').optional().isIn(['PDF', 'VIDEO', 'LINK']),
    body('fileUrl').optional().custom((value) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Allow URLs, paths, and GUIDs (for Bunny Stream videos)
        const urlRegex = /^(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\/][^\s]*|images\/.+|avatars\/.+|materials\/.+|uploads\/.+|videos\/.+|audios\/.+|documents\/.+|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
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
  UpdateMaterial
);

// Delete material
router.delete('/materials/:id', authMiddleware, adminOnly, DeleteMaterial);

// Complete material (for progress tracking)
router.post('/materials/:id/complete', authMiddleware, CompleteMaterial);

// ===== ENROLLMENT MANAGEMENT ROUTES =====

// Enroll in course
router.post('/enrollments/enroll', authMiddleware,
  [
    body('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
  ],
  EnrollInCourse
);

// Get my enrollments
router.get('/enrollments/my-enrollments', authMiddleware, GetMyEnrollments);

// Get course students
router.get('/enrollments/course/:courseId/students', authMiddleware, GetCourseStudents);

// Update enrollment status
router.put('/enrollments/:enrollmentId/status', authMiddleware,
  [
    param('enrollmentId').isLength({ min: 1 }).withMessage('Enrollment ID is required'),
    body('status').isIn(['ACTIVE', 'COMPLETED', 'DROPPED']),
  ],
  UpdateEnrollmentStatus
);

// Get enrollment progress
router.get('/enrollments/progress/:courseId', authMiddleware, GetEnrollmentProgress);

// Delete enrollment
router.delete('/enrollments/:enrollmentId', authMiddleware, DeleteEnrollment);

// ===== UPLOAD ROUTES =====

// Single file upload
router.post('/uploads/single', authMiddleware, upload.single('file'), asyncHandler(UploadSingleFile));

// Multiple file upload
router.post('/uploads/multiple', authMiddleware, upload.array('files', 5), asyncHandler(UploadMultipleFiles));

// Avatar upload with CDN and old avatar deletion
router.post('/uploads/avatar', authMiddleware, upload_avatar, asyncHandler(UploadAdminAvatar));

// Course thumbnail upload
router.post('/uploads/course-thumbnail', authMiddleware, upload.single('thumbnail'), asyncHandler(UploadCourseThumbnail));

// Material upload
router.post('/uploads/material', authMiddleware, upload.single('file'), asyncHandler(UploadMaterial));

// Delete file
router.delete('/uploads/file/:filename', authMiddleware, asyncHandler(DeleteUploadedFile));

// Get file info
router.get('/uploads/file-info/:filename', authMiddleware, asyncHandler(GetFileInfo));

// ===== ANALYTICS ROUTES =====

// Get tutor analytics
router.get('/analytics/tutor', authMiddleware, GetTutorAnalytics);

// Get course completion analytics
router.get('/analytics/course/:courseId/completion', authMiddleware, GetCourseCompletion);

// ===== ASSIGNMENT ROUTES =====

// Create assignment
router.post('/assignments', authMiddleware, adminOnly,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
    body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
    body('maxScore').optional().isFloat({ min: 0 }).withMessage('Max score must be a positive number'),
    body('courseId').isLength({ min: 1 }).withMessage('Course ID is required'),
  ],
  CreateAssignment
);

// Get assignments for a course
router.get('/assignments/course/:courseId', authMiddleware, GetCourseAssignments);

// Get assignment by ID
router.get('/assignments/:id', authMiddleware, GetAssignmentById);

// Update assignment
router.put('/assignments/:id', authMiddleware, adminOnly,
  [
    param('id').isLength({ min: 1 }).withMessage('Assignment ID is required'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ min: 1 }),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
    body('maxScore').optional().isFloat({ min: 0 }).withMessage('Max score must be a positive number'),
  ],
  UpdateAssignment
);

// Delete assignment
router.delete('/assignments/:id', authMiddleware, adminOnly, DeleteAssignment);

// Get assignment submissions
router.get('/assignments/:assignmentId/submissions', authMiddleware, GetAssignmentSubmissions);

// Grade submission
router.put('/assignments/submissions/:submissionId/grade', authMiddleware, adminOnly,
  [
    body('score').isFloat({ min: 0 }).withMessage('Score must be a positive number'),
    body('feedback').optional().trim(),
  ],
  GradeSubmission
);

export default router;
