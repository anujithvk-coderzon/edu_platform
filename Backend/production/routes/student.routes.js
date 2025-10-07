"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// Import middleware
const errorHandler_1 = require("../middleware/errorHandler");
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
router.get('/auth/me', (0, errorHandler_1.asyncHandler)(studentController_1.GetCurrentUser));
router.put('/auth/profile', [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('avatar').optional().isString(),
], (0, errorHandler_1.asyncHandler)(studentController_1.UpdateProfile));
// Change Password endpoint
router.put('/auth/change-password', [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], (0, errorHandler_1.asyncHandler)(studentController_1.ChangePassword));
router.post('/uploads/avatar', multer_1.upload_avatar, (0, errorHandler_1.asyncHandler)(studentController_1.UploadStudentAvatar));
// ===== COURSES ROUTES =====
router.get('/courses', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('category').optional().isString(),
    (0, express_validator_1.query)('level').optional().isString(),
    (0, express_validator_1.query)('search').optional().isString(),
], (0, errorHandler_1.asyncHandler)(studentController_1.GetAllCourses));
router.get('/courses/categories/all', (0, errorHandler_1.asyncHandler)(studentController_1.GetAllCategories));
// ===== ENROLLMENT ROUTES =====
// Get my enrollments
router.get('/enrollments/my-enrollments', (0, errorHandler_1.asyncHandler)(studentController_1.GetMyEnrollments));
// Enroll in a course
router.post('/enrollments/enroll', (0, errorHandler_1.asyncHandler)(studentController_1.EnrollInCourse));
// Get progress for a specific course
router.get('/enrollments/progress/:courseId', (0, errorHandler_1.asyncHandler)(studentController_1.GetEnrollmentProgress));
// ===== MATERIALS ENDPOINTS =====
// Get material by ID
router.get('/materials/:id', (0, errorHandler_1.asyncHandler)(studentController_1.GetMaterialById));
// Mark material as complete
router.post('/materials/:id/complete', (0, errorHandler_1.asyncHandler)(studentController_1.CompleteMaterial));
// Test endpoint to check file accessibility
router.get('/test/file/:filename', (0, errorHandler_1.asyncHandler)(studentController_1.TestFileAccess));
// ===== COURSE ENDPOINTS WITH RATINGS =====
// Get course by ID with rating information
router.get('/courses/:id', (0, errorHandler_1.asyncHandler)(studentController_1.GetCourseById));
// ===== REVIEW ENDPOINTS =====
// Submit a course review
router.post('/reviews', (0, errorHandler_1.asyncHandler)(studentController_1.SubmitReview));
// Get reviews for a course
router.get('/reviews/course/:courseId', (0, errorHandler_1.asyncHandler)(studentController_1.GetCourseReviews));
// Get user's review for a specific course
router.get('/reviews/my-review/:courseId', (0, errorHandler_1.asyncHandler)(studentController_1.GetMyReview));
// ===== ASSIGNMENT ENDPOINTS =====
// Get assignments for enrolled courses
router.get('/assignments/course/:courseId', (0, errorHandler_1.asyncHandler)(studentController_1.GetCourseAssignments));
// Submit assignment
router.post('/assignments/:assignmentId/submit', (0, errorHandler_1.asyncHandler)(studentController_1.SubmitAssignment));
// Get assignment submission
router.get('/assignments/:assignmentId/submission', (0, errorHandler_1.asyncHandler)(studentController_1.GetAssignmentSubmission));
// Upload assignment file
router.post('/assignments/upload', multer_1.upload_assignment, (0, errorHandler_1.asyncHandler)(studentController_1.UploadAssignmentFile));
// ===== PUBLIC PLATFORM STATISTICS =====
// Get platform-wide statistics (public endpoint)
router.get('/platform/stats', (0, errorHandler_1.asyncHandler)(studentController_1.GetPlatformStats));
// ===== PDF PROXY FOR CORS =====
// Proxy PDF files to avoid CORS issues with react-pdf
router.get('/proxy/pdf', async (req, res) => {
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
    }
    catch (error) {
        console.error('PDF proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch PDF' });
    }
});
exports.default = router;
