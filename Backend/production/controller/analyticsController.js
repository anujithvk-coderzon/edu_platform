"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCourseCompletion = exports.GetTutorAnalytics = void 0;
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const client_1 = require("@prisma/client");
const GetTutorAnalytics = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const userId = req.user.id;
        const courses = await DB_Config_1.default.course.findMany({
            where: {
                creatorId: userId,
            },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        materials: true,
                        reviews: true,
                    },
                },
            },
        });
        const totalStudents = await DB_Config_1.default.enrollment.count({
            where: {
                course: {
                    creatorId: userId,
                },
            },
        });
        const totalRevenue = courses.reduce((sum, course) => sum + course.price * course._count.enrollments, 0);
        const analytics = {
            totalCourses: courses.length,
            totalStudents,
            totalRevenue,
            courseBreakdown: {
                published: courses.filter((c) => c.status === client_1.CourseStatus.PUBLISHED)
                    .length,
                draft: courses.filter((c) => c.status === client_1.CourseStatus.DRAFT).length,
                archived: courses.filter((c) => c.status === client_1.CourseStatus.ARCHIVED)
                    .length,
            },
            recentCourses: courses
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5),
        };
        res.json({
            success: true,
            data: { analytics },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetTutorAnalytics = GetTutorAnalytics;
const GetCourseCompletion = async (req, res) => {
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
        const totalMaterials = await DB_Config_1.default.material.count({
            where: { courseId },
        });
        const enrollments = await DB_Config_1.default.enrollment.findMany({
            where: { courseId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        const completionData = await Promise.all(enrollments.map(async (enrollment) => {
            const completedMaterials = await DB_Config_1.default.progress.count({
                where: {
                    studentId: enrollment.studentId,
                    courseId: courseId,
                    isCompleted: true,
                },
            });
            const completionPercentage = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;
            return {
                student: enrollment.student,
                enrolledAt: enrollment.enrolledAt,
                completedMaterials,
                totalMaterials,
                completionPercentage: Math.round(completionPercentage),
            };
        }));
        const averageCompletion = completionData.length > 0
            ? completionData.reduce((sum, data) => sum + data.completionPercentage, 0) /
                completionData.length
            : 0;
        res.json({
            success: true,
            data: {
                courseId,
                courseTitle: course.title,
                totalStudents: enrollments.length,
                totalMaterials,
                averageCompletion: Math.round(averageCompletion),
                studentProgress: completionData,
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
exports.GetCourseCompletion = GetCourseCompletion;
