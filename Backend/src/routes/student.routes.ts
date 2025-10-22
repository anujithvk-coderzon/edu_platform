import express from 'express';
import { body, query } from 'express-validator';

// Import middleware
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

// Import multer configurations
import { upload_assignment, upload_avatar } from '../multer/multer';

// Import all controller functions
import {
  // Auth Controllers
  CheckEmail,
  VerifyEmail,
  VerifyOtpEmail,
  RegisterStudent,
  VerifyOtp,
  ResendOtp,
  OAuthRegister,
  OAuthLogin,
  LoginStudent,
  LogoutStudent,
  ForgotPassword,
  VerifyForgotPasswordOtp,
  ResetPassword,
  GetCurrentUser,
  UpdateProfile,
  ChangePassword,
  UploadStudentAvatar,

  // Course Controllers
  GetAllCourses,
  GetAllCategories,
  GetCourseById,

  // Enrollment Controllers
  GetMyEnrollments,
  EnrollInCourse,
  GetEnrollmentProgress,

  // Material Controllers
  GetMaterialById,
  CompleteMaterial,
  TestFileAccess,

  // Review Controllers
  SubmitReview,
  GetCourseReviews,
  GetMyReview,

  // Assignment Controllers
  GetCourseAssignments,
  SubmitAssignment,
  GetAssignmentSubmission,
  UploadAssignmentFile,

  // Platform Stats
  GetPlatformStats,

  // Debug
  DebugSessionInfo
} from '../controller/studentController';

const router = express.Router();

// ===== STUDENT AUTH ROUTES =====

// Check if email exists (for validation only - no OTP sent)
router.post('/auth/check-email',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  asyncHandler(CheckEmail)
);

// Step 1: Verify email and send OTP (before showing full registration form)
router.post('/auth/verify-email',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  asyncHandler(VerifyEmail)
);

// Step 2: Verify OTP (before showing full registration form)
router.post('/auth/verify-otp-email',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }),
  ],
  asyncHandler(VerifyOtpEmail)
);

// Step 3: Complete registration with user details
router.post('/auth/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
    body('phone').optional().trim().isLength({ min: 1 }),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
    body('country').optional().trim().isLength({ min: 1 }),
    body('city').optional().trim().isLength({ min: 1 }),
    body('education').optional().trim().isLength({ min: 1 }),
    body('institution').optional().trim().isLength({ min: 1 }),
    body('occupation').optional().trim().isLength({ min: 1 }),
    body('company').optional().trim().isLength({ min: 1 }),
  ],
  asyncHandler(RegisterStudent)
);

// Step 2: Verify OTP and create account
router.post('/auth/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }),
  ],
  asyncHandler(VerifyOtp)
);

// Resend OTP endpoint
router.post('/auth/resend-otp',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  asyncHandler(ResendOtp)
);

// OAuth Registration (Google/GitHub)
router.post('/auth/oauth-register',
  [
    body('provider').isIn(['google', 'github']),
    body('email').isEmail().normalizeEmail(),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
    body('avatar').optional().isString(),
    body('phone').optional().trim().isLength({ min: 1 }),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
    body('country').optional().trim().isLength({ min: 1 }),
    body('city').optional().trim().isLength({ min: 1 }),
    body('education').optional().trim().isLength({ min: 1 }),
    body('institution').optional().trim().isLength({ min: 1 }),
    body('occupation').optional().trim().isLength({ min: 1 }),
    body('company').optional().trim().isLength({ min: 1 }),
  ],
  asyncHandler(OAuthRegister)
);

// OAuth Login (Google/GitHub)
router.post('/auth/oauth-login',
  [
    body('provider').isIn(['google', 'github']),
    body('email').isEmail().normalizeEmail(),
    body('idToken').optional().isString(),
  ],
  asyncHandler(OAuthLogin)
);

router.post('/auth/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  asyncHandler(LoginStudent)
);

router.post('/auth/logout', LogoutStudent);

// Forgot Password - Step 1: Send OTP to email
router.post('/auth/forgot-password',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  asyncHandler(ForgotPassword)
);

// Forgot Password - Step 2: Verify OTP
router.post('/auth/verify-forgot-password-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }),
  ],
  asyncHandler(VerifyForgotPasswordOtp)
);

// Forgot Password - Step 3: Reset Password
router.post('/auth/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  asyncHandler(ResetPassword)
);

router.get('/auth/me', authMiddleware, asyncHandler(GetCurrentUser));

router.put('/auth/profile',
  authMiddleware,
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('avatar').optional().isString(),
  ],
  asyncHandler(UpdateProfile)
);

// Change Password endpoint
router.put('/auth/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  asyncHandler(ChangePassword)
);

router.post('/uploads/avatar', authMiddleware, upload_avatar, asyncHandler(UploadStudentAvatar));

// ===== COURSES ROUTES =====
router.get('/courses',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('level').optional().isString(),
    query('search').optional().isString(),
  ],
  asyncHandler(GetAllCourses)
);

router.get('/courses/categories/all', asyncHandler(GetAllCategories));

// ===== ENROLLMENT ROUTES =====

// Get my enrollments
router.get('/enrollments/my-enrollments', authMiddleware, asyncHandler(GetMyEnrollments));

// Enroll in a course
router.post('/enrollments/enroll', authMiddleware, asyncHandler(EnrollInCourse));

// Get progress for a specific course
router.get('/enrollments/progress/:courseId', authMiddleware, asyncHandler(GetEnrollmentProgress));

// ===== MATERIALS ENDPOINTS =====
// Get material by ID
router.get('/materials/:id', authMiddleware, asyncHandler(GetMaterialById));

// Mark material as complete
router.post('/materials/:id/complete', authMiddleware, asyncHandler(CompleteMaterial));

// Test endpoint to check file accessibility
router.get('/test/file/:filename', asyncHandler(TestFileAccess));

// ===== COURSE ENDPOINTS WITH RATINGS =====
// Get course by ID with rating information
router.get('/courses/:id', asyncHandler(GetCourseById));

// ===== REVIEW ENDPOINTS =====
// Submit a course review
router.post('/reviews', authMiddleware, asyncHandler(SubmitReview));

// Get reviews for a course
router.get('/reviews/course/:courseId', asyncHandler(GetCourseReviews));

// Get user's review for a specific course
router.get('/reviews/my-review/:courseId', authMiddleware, asyncHandler(GetMyReview));

// ===== ASSIGNMENT ENDPOINTS =====
// Get assignments for enrolled courses
router.get('/assignments/course/:courseId', authMiddleware, asyncHandler(GetCourseAssignments));

// Submit assignment
router.post('/assignments/:assignmentId/submit', authMiddleware, asyncHandler(SubmitAssignment));

// Get assignment submission
router.get('/assignments/:assignmentId/submission', authMiddleware, asyncHandler(GetAssignmentSubmission));

// Upload assignment file
router.post('/assignments/upload', authMiddleware, upload_assignment, asyncHandler(UploadAssignmentFile));

// ===== PUBLIC PLATFORM STATISTICS =====
// Get platform-wide statistics (public endpoint)
router.get('/platform/stats', asyncHandler(GetPlatformStats));

// ===== DEBUG ENDPOINT (DEVELOPMENT ONLY) =====
// Check session token validity - helps debug multi-device login issues
router.get('/debug/session', asyncHandler(DebugSessionInfo));

// ===== PDF PROXY FOR CORS =====
// Proxy PDF files to avoid CORS issues with react-pdf
router.get('/proxy/pdf', async (req: express.Request, res: express.Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'PDF URL is required' });
    }

    // Fetch PDF from Bunny CDN
    const axios = require('axios');
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/pdf',
      }
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');

    res.send(response.data);
  } catch (error) {
    console.error('PDF proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
});

export default router;