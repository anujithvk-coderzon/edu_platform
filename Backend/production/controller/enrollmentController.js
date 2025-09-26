"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteEnrollment = exports.GetEnrollmentProgress = exports.UpdateEnrollmentStatus = exports.GetCourseStudents = exports.GetMyEnrollments = exports.EnrollInCourse = void 0;
const express_validator_1 = require("express-validator");
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const client_1 = require("@prisma/client");
const EnrollInCourse = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { courseId } = req.params;
        const course = await DB_Config_1.default.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            res.status(404).json({
                success: false,
                error: { message: "Course not found" },
            });
            return;
        }
        if (!course.isPublic || course.status !== client_1.CourseStatus.PUBLISHED) {
            res.status(400).json({
                success: false,
                error: { message: "Course is not available for enrollment" },
            });
            return;
        }
        const existingEnrollment = await DB_Config_1.default.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: req.user.id,
                    courseId: courseId,
                },
            },
        });
        if (existingEnrollment) {
            res.status(400).json({
                success: false,
                error: { message: "Already enrolled in this course" },
            });
            return;
        }
        const enrollment = await DB_Config_1.default.enrollment.create({
            data: {
                studentId: req.user.id,
                courseId: courseId,
                status: client_1.EnrollmentStatus.ACTIVE,
                enrolledAt: new Date(),
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        thumbnail: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: { enrollment },
            message: "Successfully enrolled in course",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.EnrollInCourse = EnrollInCourse;
const GetMyEnrollments = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const enrollments = await DB_Config_1.default.enrollment.findMany({
            where: { studentId: req.user.id },
            include: {
                course: {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        _count: {
                            select: {
                                materials: true,
                            },
                        },
                    },
                },
            },
            orderBy: { enrolledAt: "desc" },
        });
        const enrollmentsWithProgress = await Promise.all(enrollments.map(async (enrollment) => {
            const totalMaterials = enrollment.course._count.materials;
            const completedMaterials = await DB_Config_1.default.progress.count({
                where: {
                    studentId: req.user.id,
                    courseId: enrollment.courseId,
                    isCompleted: true,
                },
            });
            const progressPercentage = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;
            return {
                ...enrollment,
                progress: {
                    completed: completedMaterials,
                    total: totalMaterials,
                    percentage: Math.round(progressPercentage),
                },
            };
        }));
        res.json({
            success: true,
            data: { enrollments: enrollmentsWithProgress },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetMyEnrollments = GetMyEnrollments;
const GetCourseStudents = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { courseId } = req.params;
        const course = await DB_Config_1.default.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            res.status(404).json({
                success: false,
                error: { message: "Course not found" },
            });
            return;
        }
        if (course.creatorId !== req.user.id &&
            req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Access denied" },
            });
            return;
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
                        avatar: true,
                    },
                },
            },
            orderBy: { enrolledAt: "desc" },
        });
        const studentsWithProgress = await Promise.all(enrollments.map(async (enrollment) => {
            const totalMaterials = await DB_Config_1.default.material.count({
                where: { courseId },
            });
            const completedMaterials = await DB_Config_1.default.progress.count({
                where: {
                    studentId: enrollment.studentId,
                    courseId: courseId,
                    isCompleted: true,
                },
            });
            const progressPercentage = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;
            return {
                ...enrollment,
                progress: {
                    completed: completedMaterials,
                    total: totalMaterials,
                    percentage: Math.round(progressPercentage),
                },
            };
        }));
        res.json({
            success: true,
            data: { students: studentsWithProgress },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetCourseStudents = GetCourseStudents;
const UpdateEnrollmentStatus = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Admin access required" },
            });
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: { message: "Validation failed", details: errors.array() },
            });
            return;
        }
        const { enrollmentId } = req.params;
        const { status } = req.body;
        const enrollment = await DB_Config_1.default.enrollment.update({
            where: { id: enrollmentId },
            data: { status: status },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            data: { enrollment },
            message: "Enrollment status updated successfully",
        });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({
                success: false,
                error: { message: "Enrollment not found" },
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UpdateEnrollmentStatus = UpdateEnrollmentStatus;
const GetEnrollmentProgress = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { courseId } = req.params;
        const enrollment = await DB_Config_1.default.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: req.user.id,
                    courseId: courseId,
                },
            },
            include: {
                course: {
                    include: {
                        materials: {
                            orderBy: [
                                { module: { orderIndex: "asc" } },
                                { orderIndex: "asc" },
                            ],
                        },
                    },
                },
            },
        });
        if (!enrollment) {
            res.status(404).json({
                success: false,
                error: { message: "Enrollment not found" },
            });
            return;
        }
        const progress = await DB_Config_1.default.progress.findMany({
            where: {
                studentId: req.user.id,
                courseId: courseId,
            },
        });
        const progressMap = progress.reduce((acc, progress) => {
            acc[progress.materialId] = progress;
            return acc;
        }, {});
        const materialsWithProgress = enrollment.course.materials.map((material) => ({
            ...material,
            progress: progressMap[material.id] || null,
        }));
        const totalMaterials = enrollment.course.materials.length;
        const completedMaterials = progress.filter((p) => p.isCompleted).length;
        const progressPercentage = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;
        res.json({
            success: true,
            data: {
                enrollment: {
                    ...enrollment,
                    course: {
                        ...enrollment.course,
                        materials: materialsWithProgress,
                    },
                },
                progress: {
                    completed: completedMaterials,
                    total: totalMaterials,
                    percentage: Math.round(progressPercentage),
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetEnrollmentProgress = GetEnrollmentProgress;
const DeleteEnrollment = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { enrollmentId } = req.params;
        const enrollment = await DB_Config_1.default.enrollment.findUnique({
            where: { id: enrollmentId },
        });
        if (!enrollment) {
            res.status(404).json({
                success: false,
                error: { message: "Enrollment not found" },
            });
            return;
        }
        if (enrollment.studentId !== req.user.id &&
            req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Access denied" },
            });
            return;
        }
        await DB_Config_1.default.enrollment.delete({
            where: { id: enrollmentId },
        });
        res.json({
            success: true,
            message: "Enrollment deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.DeleteEnrollment = DeleteEnrollment;
