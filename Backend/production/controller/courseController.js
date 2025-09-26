"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCourse = exports.PublishCourse = exports.UpdateCourse = exports.CreateCourse = exports.GetCourseById = exports.GetMyCourses = exports.GetAllCourses = void 0;
const express_validator_1 = require("express-validator");
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const client_1 = require("@prisma/client");
const fileUtils_1 = require("../utils/fileUtils");
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
            isPublic: true,
        };
        if (category) {
            where.category = { name: { contains: category, mode: "insensitive" } };
        }
        if (level) {
            where.level = { contains: level, mode: "insensitive" };
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
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
                            enrollments: true,
                            reviews: true,
                            materials: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            DB_Config_1.default.course.count({ where }),
        ]);
        const coursesWithAvgRating = await Promise.all(courses.map(async (course) => {
            const avgRating = await DB_Config_1.default.review.aggregate({
                where: { courseId: course.id },
                _avg: { rating: true },
            });
            return {
                ...course,
                averageRating: avgRating._avg.rating || 0,
            };
        }));
        res.json({
            success: true,
            data: {
                courses: coursesWithAvgRating,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
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
exports.GetAllCourses = GetAllCourses;
const GetMyCourses = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const userId = req.user.id;
        const userRole = req.user.role;
        let whereClause = {};
        if (userRole === "admin") {
            whereClause = {};
        }
        else if (userRole === "tutor") {
            whereClause = {
                creatorId: userId,
            };
        }
        else {
            whereClause = { creatorId: userId };
        }
        const courses = await DB_Config_1.default.course.findMany({
            where: whereClause,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                        materials: true,
                        reviews: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({
            success: true,
            data: { courses },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetMyCourses = GetMyCourses;
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
                        avatar: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
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
                                isPublic: true,
                            },
                            orderBy: { orderIndex: "asc" },
                        },
                    },
                    orderBy: { orderIndex: "asc" },
                },
                reviews: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
                _count: {
                    select: {
                        enrollments: true,
                        materials: true,
                        reviews: true,
                    },
                },
            },
        });
        if (!course) {
            res.status(404).json({
                success: false,
                error: { message: "Course not found" },
            });
            return;
        }
        const avgRating = await DB_Config_1.default.review.aggregate({
            where: { courseId: course.id },
            _avg: { rating: true },
        });
        let isEnrolled = false;
        res.json({
            success: true,
            data: {
                course: {
                    ...course,
                    averageRating: avgRating._avg.rating || 0,
                    isEnrolled,
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
exports.GetCourseById = GetCourseById;
const CreateCourse = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
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
        const { title, description, price = 0, duration, level, categoryId, thumbnail, tutorName, objectives = [], requirements = [], tags = [], } = req.body;
        // Validate category exists
        if (categoryId) {
            const category = await DB_Config_1.default.category.findUnique({
                where: { id: categoryId },
            });
            if (!category) {
                res.status(400).json({
                    success: false,
                    error: { message: "Invalid category ID" },
                });
                return;
            }
        }
        const course = await DB_Config_1.default.course.create({
            data: {
                title,
                description,
                price: parseFloat(price),
                duration: duration ? parseInt(duration) : null,
                level,
                categoryId,
                thumbnail,
                tutorName: tutorName || `${req.user.firstName} ${req.user.lastName}`,
                creatorId: req.user.id,
                status: client_1.CourseStatus.DRAFT,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        email: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: { course },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.CreateCourse = CreateCourse;
const UpdateCourse = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
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
        const { id } = req.params;
        const updates = req.body;
        const existingCourse = await DB_Config_1.default.course.findUnique({
            where: { id },
        });
        if (!existingCourse) {
            res.status(404).json({
                success: false,
                error: { message: "Course not found" },
            });
            return;
        }
        if (existingCourse.creatorId !== req.user.id &&
            req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Access denied" },
            });
            return;
        }
        delete updates.creatorId;
        const course = await DB_Config_1.default.course.update({
            where: { id },
            data: updates,
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        email: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            data: { course },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UpdateCourse = UpdateCourse;
const PublishCourse = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { id } = req.params;
        const course = await DB_Config_1.default.course.findUnique({
            where: { id },
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
        if (course.status === client_1.CourseStatus.PUBLISHED) {
            res.status(400).json({
                success: false,
                error: { message: "Course is already published" },
            });
            return;
        }
        const updatedCourse = await DB_Config_1.default.course.update({
            where: { id },
            data: {
                status: client_1.CourseStatus.PUBLISHED,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        email: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            data: {
                course: updatedCourse,
                message: "Course published successfully!",
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
exports.PublishCourse = PublishCourse;
const DeleteCourse = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { id } = req.params;
        const course = await DB_Config_1.default.course.findUnique({
            where: { id },
            include: {
                materials: true,
            },
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
        const filesToDelete = [];
        if (course.thumbnail)
            filesToDelete.push(course.thumbnail);
        course.materials.forEach((material) => {
            if (material.fileUrl)
                filesToDelete.push(material.fileUrl);
        });
        await DB_Config_1.default.course.delete({
            where: { id },
        });
        if (filesToDelete.length > 0) {
            (0, fileUtils_1.deleteMultipleFiles)(filesToDelete);
        }
        res.json({
            success: true,
            message: "Course and all associated files deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.DeleteCourse = DeleteCourse;
