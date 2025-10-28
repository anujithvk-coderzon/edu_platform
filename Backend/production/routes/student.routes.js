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
// Import multer configurations
const multer_1 = require("../multer/multer");
// Import all controller functions
const studentController_1 = require("../controller/studentController");
const router = express_1.default.Router();
// ===== STUDENT AUTH ROUTES =====
// Check if email exists (for validation only - no OTP sent)
router.post('/auth/check-email', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
], (0, errorHandler_1.asyncHandler)(studentController_1.CheckEmail));
// Step 1: Verify email and send OTP (before showing full registration form)
router.post('/auth/verify-email', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
], (0, errorHandler_1.asyncHandler)(studentController_1.VerifyEmail));
// Step 2: Verify OTP (before showing full registration form)
router.post('/auth/verify-otp-email', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('otp').trim().isLength({ min: 6, max: 6 }),
], (0, errorHandler_1.asyncHandler)(studentController_1.VerifyOtpEmail));
// Step 3: Complete registration with user details
router.post('/auth/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('phone').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601(),
    (0, express_validator_1.body)('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
    (0, express_validator_1.body)('country').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('city').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('education').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('institution').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('occupation').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('company').optional().trim().isLength({ min: 1 }),
], (0, errorHandler_1.asyncHandler)(studentController_1.RegisterStudent));
// Step 2: Verify OTP and create account
router.post('/auth/verify-otp', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('otp').trim().isLength({ min: 6, max: 6 }),
], (0, errorHandler_1.asyncHandler)(studentController_1.VerifyOtp));
// Resend OTP endpoint
router.post('/auth/resend-otp', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
], (0, errorHandler_1.asyncHandler)(studentController_1.ResendOtp));
// OAuth Registration (Google/GitHub)
router.post('/auth/oauth-register', [
    (0, express_validator_1.body)('provider').isIn(['google', 'github']),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('avatar').optional().isString(),
    (0, express_validator_1.body)('phone').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601(),
    (0, express_validator_1.body)('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
    (0, express_validator_1.body)('country').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('city').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('education').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('institution').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('occupation').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('company').optional().trim().isLength({ min: 1 }),
], (0, errorHandler_1.asyncHandler)(studentController_1.OAuthRegister));
// OAuth Login (Google/GitHub)
router.post('/auth/oauth-login', [
    (0, express_validator_1.body)('provider').isIn(['google', 'github']),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('idToken').optional().isString(),
], (0, errorHandler_1.asyncHandler)(studentController_1.OAuthLogin));
router.post('/auth/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty(),
], (0, errorHandler_1.asyncHandler)(studentController_1.LoginStudent));
router.post('/auth/logout', studentController_1.LogoutStudent);
// Forgot Password - Step 1: Send OTP to email
router.post('/auth/forgot-password', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
], (0, errorHandler_1.asyncHandler)(studentController_1.ForgotPassword));
// Forgot Password - Step 2: Verify OTP
router.post('/auth/verify-forgot-password-otp', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('otp').trim().isLength({ min: 6, max: 6 }),
], (0, errorHandler_1.asyncHandler)(studentController_1.VerifyForgotPasswordOtp));
// Forgot Password - Step 3: Reset Password
router.post('/auth/reset-password', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('otp').trim().isLength({ min: 6, max: 6 }),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], (0, errorHandler_1.asyncHandler)(studentController_1.ResetPassword));
router.get('/auth/me', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.GetCurrentUser));
router.put('/auth/profile', auth_1.authMiddleware, [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('avatar').optional().isString(),
], (0, errorHandler_1.asyncHandler)(studentController_1.UpdateProfile));
// Change Password endpoint
router.put('/auth/change-password', auth_1.authMiddleware, [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], (0, errorHandler_1.asyncHandler)(studentController_1.ChangePassword));
router.post('/uploads/avatar', auth_1.authMiddleware, multer_1.upload_avatar, (0, errorHandler_1.asyncHandler)(studentController_1.UploadStudentAvatar));
// ===== COURSES ROUTES =====
router.get('/courses', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('category').optional().isString(),
    (0, express_validator_1.query)('level').optional().isString(),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('price').optional().isString(),
    (0, express_validator_1.query)('sort').optional().isString(),
], (0, errorHandler_1.asyncHandler)(studentController_1.GetAllCourses));
router.get('/courses/categories/all', (0, errorHandler_1.asyncHandler)(studentController_1.GetAllCategories));
// ===== ENROLLMENT ROUTES =====
// Get my enrollments
router.get('/enrollments/my-enrollments', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.GetMyEnrollments));
// Enroll in a course
router.post('/enrollments/enroll', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.EnrollInCourse));
// Get progress for a specific course
router.get('/enrollments/progress/:courseId', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.GetEnrollmentProgress));
// ===== MATERIALS ENDPOINTS =====
// Get material by ID
router.get('/materials/:id', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.GetMaterialById));
// Mark material as complete
router.post('/materials/:id/complete', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.CompleteMaterial));
// Test endpoint to check file accessibility
router.get('/test/file/:filename', (0, errorHandler_1.asyncHandler)(studentController_1.TestFileAccess));
// ===== COURSE ENDPOINTS WITH RATINGS =====
// Get course by ID with rating information
router.get('/courses/:id', (0, errorHandler_1.asyncHandler)(studentController_1.GetCourseById));
// ===== REVIEW ENDPOINTS =====
// Submit a course review
router.post('/reviews', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.SubmitReview));
// Get reviews for a course (with pagination)
router.get('/reviews/course/:courseId', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 })
], (0, errorHandler_1.asyncHandler)(studentController_1.GetCourseReviews));
// Get user's review for a specific course
router.get('/reviews/my-review/:courseId', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.GetMyReview));
// ===== ASSIGNMENT ENDPOINTS =====
// Get assignments for enrolled courses
router.get('/assignments/course/:courseId', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.GetCourseAssignments));
// Submit assignment
router.post('/assignments/:assignmentId/submit', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.SubmitAssignment));
// Get assignment submission
router.get('/assignments/:assignmentId/submission', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(studentController_1.GetAssignmentSubmission));
// Upload assignment file
router.post('/assignments/upload', auth_1.authMiddleware, multer_1.upload_assignment, (0, errorHandler_1.asyncHandler)(studentController_1.UploadAssignmentFile));
// ===== PUBLIC PLATFORM STATISTICS =====
// Get platform-wide statistics (public endpoint)
router.get('/platform/stats', (0, errorHandler_1.asyncHandler)(studentController_1.GetPlatformStats));
// ===== DEBUG ENDPOINT (DEVELOPMENT ONLY) =====
// Check session token validity - helps debug multi-device login issues
router.get('/debug/session', (0, errorHandler_1.asyncHandler)(studentController_1.DebugSessionInfo));
// ===== PDF PROXY FOR CORS =====
// Handle OPTIONS preflight request
router.options('/proxy/pdf', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Range');
    res.status(200).send();
});
// Proxy PDF files to avoid CORS issues with react-pdf
router.get('/proxy/pdf', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'PDF URL is required' });
        }
        // Fetch PDF from Bunny CDN with authentication
        const axios = require('axios');
        // Check if URL is from Bunny Storage (requires authentication)
        const isBunnyStorage = url.includes('storage.bunnycdn.com') || url.includes('.b-cdn.net');
        const headers = {
            'Accept': 'application/pdf',
        };
        // Add authentication for Bunny Storage
        if (isBunnyStorage) {
            const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
            if (accessKey) {
                headers['AccessKey'] = accessKey;
            }
        }
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers,
            timeout: 30000 // 30 second timeout
        });
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(response.data);
    }
    catch (error) {
        console.error('PDF proxy error:', error.message);
        console.error('Requested URL:', req.query.url);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
        if (error.code === 'ETIMEDOUT') {
            return res.status(504).json({ error: 'PDF fetch timeout. Please try again.' });
        }
        if (error.code === 'ENOTFOUND') {
            return res.status(404).json({ error: 'PDF not found at source URL' });
        }
        // Set CORS headers even for error responses
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(500).json({
            error: 'Failed to fetch PDF',
            details: error.message
        });
    }
});
exports.default = router;
