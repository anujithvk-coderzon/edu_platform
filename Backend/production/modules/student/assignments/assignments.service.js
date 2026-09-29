"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAssignmentFileService = exports.getSubmissionService = exports.submitAssignmentService = exports.listCourseAssignmentsService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const cdnStorage_1 = require("../../../lib/cdnStorage");
const cdnStreaming_1 = require("../../../lib/cdnStreaming");
const localStorage_1 = require("../../../lib/localStorage");
const LARGE_FILE_BYTES = 20 * 1024 * 1024;
const listCourseAssignmentsService = async (studentId, courseId) => {
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) {
        throw new Errors_1.ForbiddenError("You are not enrolled in this course.");
    }
    const assignments = await prisma_1.default.assignment.findMany({
        where: { courseId },
        include: {
            submissions: {
                where: { studentId },
                select: {
                    id: true,
                    status: true,
                    score: true,
                    submittedAt: true,
                    gradedAt: true,
                },
            },
        },
        orderBy: { createdAt: "asc" },
    });
    return { assignments };
};
exports.listCourseAssignmentsService = listCourseAssignmentsService;
const submitAssignmentService = async (studentId, assignmentId, input) => {
    const assignment = await prisma_1.default.assignment.findUnique({
        where: { id: assignmentId },
        include: {
            course: { include: { enrollments: { where: { studentId } } } },
        },
    });
    if (!assignment) {
        throw new Errors_1.NotFoundError("Assignment not found.");
    }
    if (assignment.course.enrollments.length === 0) {
        throw new Errors_1.ForbiddenError("You are not enrolled in this course.");
    }
    const existing = await prisma_1.default.assignmentSubmission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
    });
    if (existing) {
        throw new Errors_1.BadRequestError("You have already submitted this assignment.");
    }
    if (assignment.dueDate && new Date() > assignment.dueDate) {
        throw new Errors_1.BadRequestError("Assignment due date has passed.");
    }
    const submission = await prisma_1.default.assignmentSubmission.create({
        data: {
            content: input.content || "",
            fileUrl: input.fileUrl || null,
            assignmentId,
            studentId,
            status: "SUBMITTED",
        },
        include: {
            assignment: { select: { title: true, maxScore: true, dueDate: true } },
        },
    });
    // Progress rows can outlive their material, so completion is counted only
    // against materials that still exist.
    const existingMaterials = await prisma_1.default.material.findMany({
        where: { courseId: assignment.courseId },
        select: { id: true },
    });
    const existingMaterialIds = existingMaterials.map((m) => m.id);
    const [completedMaterials, totalAssignments, submittedAssignments] = await Promise.all([
        prisma_1.default.progress.count({
            where: {
                studentId,
                courseId: assignment.courseId,
                isCompleted: true,
                materialId: { in: existingMaterialIds },
            },
        }),
        prisma_1.default.assignment.count({ where: { courseId: assignment.courseId } }),
        prisma_1.default.assignmentSubmission.count({
            where: { studentId, assignment: { courseId: assignment.courseId } },
        }),
    ]);
    const totalMaterials = existingMaterials.length;
    const totalItems = totalMaterials + totalAssignments;
    const completedItems = completedMaterials + submittedAssignments;
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    await prisma_1.default.enrollment.update({
        where: {
            studentId_courseId: { studentId, courseId: assignment.courseId },
        },
        data: {
            progressPercentage,
            ...(progressPercentage === 100 && {
                completedAt: new Date(),
                status: "COMPLETED",
            }),
        },
    });
    return {
        submission,
        progressUpdate: { progressPercentage, totalItems, completedItems },
    };
};
exports.submitAssignmentService = submitAssignmentService;
const getSubmissionService = async (studentId, assignmentId) => {
    const submission = await prisma_1.default.assignmentSubmission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        include: {
            assignment: { select: { title: true, maxScore: true, dueDate: true } },
        },
    });
    return { submission };
};
exports.getSubmissionService = getSubmissionService;
const uploadAssignmentFileService = async (file) => {
    const useLocal = process.env.NODE_ENV === "development" || !process.env.BUNNY_API_KEY;
    const fileUrl = useLocal
        ? await (0, localStorage_1.Upload_Files_Local)("assignments", file)
        : file.size > LARGE_FILE_BYTES
            ? await (0, cdnStreaming_1.Upload_Files_Stream)("assignments", file)
            : await (0, cdnStorage_1.Upload_Files)("assignments", file);
    if (!fileUrl) {
        throw new Errors_1.InternalServerError("Failed to upload assignment file to storage");
    }
    return {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fileUrl,
    };
};
exports.uploadAssignmentFileService = uploadAssignmentFileService;
