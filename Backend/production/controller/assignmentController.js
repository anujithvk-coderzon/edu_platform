"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetStudentSubmission = exports.SubmitAssignment = exports.GetStudentCourseAssignments = exports.GradeSubmission = exports.GetAssignmentSubmissions = exports.DeleteAssignment = exports.UpdateAssignment = exports.GetAssignmentById = exports.GetCourseAssignments = exports.CreateAssignment = void 0;
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const progressCalculator_1 = require("../utils/progressCalculator");
// ===== ADMIN ASSIGNMENT CONTROLLERS =====
/**
 * Create a new assignment
 */
const CreateAssignment = async (req, res) => {
    try {
        const { title, description, dueDate, maxScore, courseId } = req.body;
        const creatorId = req.user.id;
        // Verify course ownership
        const currentUser = await DB_Config_1.default.admin.findUnique({
            where: { id: creatorId },
            select: { role: true }
        });
        // Check course exists and user has permission
        const courseFilter = currentUser?.role === 'Admin'
            ? { id: courseId }
            : {
                id: courseId,
                OR: [
                    { creatorId }, // Course they created
                    { tutorId: creatorId } // Course assigned to them
                ]
            };
        const course = await DB_Config_1.default.course.findFirst({
            where: courseFilter
        });
        if (!course) {
            return res.status(404).json({
                success: false,
                error: { message: 'Course not found or you do not have permission to add assignments to it.' }
            });
        }
        const assignment = await DB_Config_1.default.assignment.create({
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                maxScore: maxScore || 100,
                courseId,
                creatorId
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                creator: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: { assignment }
        });
    }
    catch (error) {
        console.error('Create assignment error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to create assignment.' }
        });
    }
};
exports.CreateAssignment = CreateAssignment;
/**
 * Get assignments for a course
 */
const GetCourseAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        // Get current user's role
        const currentUser = await DB_Config_1.default.admin.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        // Check course exists and user has permission
        const courseFilter = currentUser?.role === 'Admin'
            ? { id: courseId }
            : {
                id: courseId,
                OR: [
                    { creatorId: userId }, // Course they created
                    { tutorId: userId } // Course assigned to them
                ]
            };
        const course = await DB_Config_1.default.course.findFirst({
            where: courseFilter
        });
        if (!course) {
            return res.status(404).json({
                success: false,
                error: { message: 'Course not found or you do not have permission to view its assignments.' }
            });
        }
        const assignments = await DB_Config_1.default.assignment.findMany({
            where: { courseId },
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                },
                submissions: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        // Calculate ungraded submissions for each assignment
        const assignmentsWithCounts = assignments.map(assignment => {
            const ungradedCount = assignment.submissions.filter(s => s.status !== 'GRADED').length;
            const { submissions, ...assignmentData } = assignment;
            return {
                ...assignmentData,
                ungradedSubmissions: ungradedCount
            };
        });
        res.json({
            success: true,
            data: { assignments: assignmentsWithCounts }
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
exports.GetCourseAssignments = GetCourseAssignments;
/**
 * Get assignment by ID
 */
const GetAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Get current user's role
        const currentUser = await DB_Config_1.default.admin.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        // Check assignment exists and user has permission
        const assignmentFilter = currentUser?.role === 'Admin'
            ? { id }
            : { id, creatorId: userId };
        const assignment = await DB_Config_1.default.assignment.findFirst({
            where: assignmentFilter,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                creator: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                error: { message: 'Assignment not found or you do not have permission to view it.' }
            });
        }
        res.json({
            success: true,
            data: { assignment }
        });
    }
    catch (error) {
        console.error('Get assignment error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get assignment.' }
        });
    }
};
exports.GetAssignmentById = GetAssignmentById;
/**
 * Update assignment
 */
const UpdateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, maxScore } = req.body;
        const userId = req.user.id;
        // Get current user's role
        const currentUser = await DB_Config_1.default.admin.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        // Check assignment exists and user has permission
        const assignmentFilter = currentUser?.role === 'Admin'
            ? { id }
            : { id, creatorId: userId };
        const existingAssignment = await DB_Config_1.default.assignment.findFirst({
            where: assignmentFilter
        });
        if (!existingAssignment) {
            return res.status(404).json({
                success: false,
                error: { message: 'Assignment not found or you do not have permission to update it.' }
            });
        }
        const assignment = await DB_Config_1.default.assignment.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(maxScore && { maxScore })
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                creator: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: { assignment }
        });
    }
    catch (error) {
        console.error('Update assignment error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to update assignment.' }
        });
    }
};
exports.UpdateAssignment = UpdateAssignment;
/**
 * Delete assignment
 */
const DeleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Get current user's role
        const currentUser = await DB_Config_1.default.admin.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        // Check assignment exists and user has permission
        const assignmentFilter = currentUser?.role === 'Admin'
            ? { id }
            : { id, creatorId: userId };
        const assignment = await DB_Config_1.default.assignment.findFirst({
            where: assignmentFilter,
            include: {
                submissions: {
                    select: {
                        fileUrl: true
                    }
                }
            }
        });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                error: { message: 'Assignment not found or you do not have permission to delete it.' }
            });
        }
        // Delete submission files
        let deletedFilesCount = 0;
        assignment.submissions.forEach(submission => {
            if (submission.fileUrl) {
                try {
                    const filename = submission.fileUrl.startsWith('/uploads/')
                        ? submission.fileUrl.replace('/uploads/', '')
                        : path.basename(submission.fileUrl);
                    const uploadDir = process.env.UPLOAD_DIR || './uploads';
                    const filePath = path.join(uploadDir, filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        deletedFilesCount++;
                        console.log(`🗑️ Deleted submission file: ${filePath}`);
                    }
                }
                catch (error) {
                    console.error('Error deleting submission file:', error);
                }
            }
        });
        // Delete assignment and all submissions (cascade delete)
        await DB_Config_1.default.assignment.delete({
            where: { id }
        });
        console.log(`✅ Assignment deleted: ${assignment.title}, Files cleaned up: ${deletedFilesCount}`);
        res.json({
            success: true,
            message: 'Assignment deleted successfully',
            data: { deletedFilesCount }
        });
    }
    catch (error) {
        console.error('Delete assignment error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to delete assignment.' }
        });
    }
};
exports.DeleteAssignment = DeleteAssignment;
/**
 * Get assignment submissions
 */
const GetAssignmentSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user.id;
        // Get current user's role
        const currentUser = await DB_Config_1.default.admin.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        // Check assignment exists and user has permission
        const assignmentFilter = currentUser?.role === 'Admin'
            ? { id: assignmentId }
            : { id: assignmentId, creatorId: userId };
        const assignment = await DB_Config_1.default.assignment.findFirst({
            where: assignmentFilter
        });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                error: { message: 'Assignment not found or you do not have permission to view its submissions.' }
            });
        }
        const submissions = await DB_Config_1.default.assignmentSubmission.findMany({
            where: { assignmentId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                assignment: {
                    select: {
                        title: true,
                        maxScore: true
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });
        // Debug logging to check fileUrl values
        console.log('📋 Fetched submissions for assignment:', assignmentId);
        submissions.forEach((sub, index) => {
            console.log(`  Submission ${index + 1}:`, {
                id: sub.id,
                studentName: sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : 'Unknown',
                hasContent: !!sub.content && sub.content.trim() !== '',
                contentLength: sub.content ? sub.content.length : 0,
                fileUrl: sub.fileUrl,
                hasFileUrl: !!sub.fileUrl && sub.fileUrl.trim() !== '',
                status: sub.status,
                score: sub.score
            });
        });
        res.json({
            success: true,
            data: { submissions }
        });
    }
    catch (error) {
        console.error('Get assignment submissions error:', error);
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid token.' }
        });
    }
};
exports.GetAssignmentSubmissions = GetAssignmentSubmissions;
/**
 * Grade assignment submission
 */
const GradeSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { score, feedback } = req.body;
        const userId = req.user.id;
        // Verify submission ownership through assignment
        const submission = await DB_Config_1.default.assignmentSubmission.findFirst({
            where: { id: submissionId },
            include: {
                assignment: {
                    select: {
                        creatorId: true,
                        maxScore: true
                    }
                }
            }
        });
        if (!submission) {
            return res.status(404).json({
                success: false,
                error: { message: 'Submission not found.' }
            });
        }
        // Get current user's role
        const currentUser = await DB_Config_1.default.admin.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        // Admins have full access, Tutors can only grade their own assignments
        if (currentUser?.role !== 'Admin' && submission.assignment.creatorId !== userId) {
            return res.status(403).json({
                success: false,
                error: { message: 'Not authorized to grade this submission.' }
            });
        }
        if (score > submission.assignment.maxScore) {
            return res.status(400).json({
                success: false,
                error: { message: `Score cannot exceed maximum score of ${submission.assignment.maxScore}` }
            });
        }
        const gradedSubmission = await DB_Config_1.default.assignmentSubmission.update({
            where: { id: submissionId },
            data: {
                score,
                feedback: feedback || null,
                status: 'GRADED',
                gradedAt: new Date()
            },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                assignment: {
                    select: {
                        title: true,
                        maxScore: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: { submission: gradedSubmission }
        });
    }
    catch (error) {
        console.error('Grade submission error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to grade submission.' }
        });
    }
};
exports.GradeSubmission = GradeSubmission;
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
        // Use centralized progress calculator
        const stats = await (0, progressCalculator_1.recalculateAndUpdateProgress)(studentId, assignment.courseId);
        res.status(201).json({
            success: true,
            data: {
                submission,
                progressUpdate: {
                    progressPercentage: stats.progressPercentage,
                    totalItems: stats.totalItems,
                    completedItems: stats.completedItems
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
