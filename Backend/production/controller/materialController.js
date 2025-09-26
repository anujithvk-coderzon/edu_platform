"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteMaterial = exports.DeleteMaterial = exports.UpdateMaterial = exports.CreateMaterial = exports.GetMaterialById = exports.GetCourseMaterials = void 0;
const express_validator_1 = require("express-validator");
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const fileUtils_1 = require("../utils/fileUtils");
const GetCourseMaterials = async (req, res) => {
    try {
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
        const materials = await DB_Config_1.default.material.findMany({
            where: { courseId },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: [
                { module: { orderIndex: "asc" } },
                { orderIndex: "asc" },
            ],
        });
        res.json({
            success: true,
            data: { materials },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetCourseMaterials = GetCourseMaterials;
const GetMaterialById = async (req, res) => {
    try {
        const { id } = req.params;
        const material = await DB_Config_1.default.material.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        creatorId: true,
                    },
                },
                module: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        if (!material) {
            res.status(404).json({
                success: false,
                error: { message: "Material not found" },
            });
            return;
        }
        res.json({
            success: true,
            data: { material },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetMaterialById = GetMaterialById;
const CreateMaterial = async (req, res) => {
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
        const { title, description, type, content, fileUrl, orderIndex, courseId, moduleId, isPublic = true, } = req.body;
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
        if (moduleId) {
            const module = await DB_Config_1.default.courseModule.findUnique({
                where: { id: moduleId },
            });
            if (!module || module.courseId !== courseId) {
                res.status(400).json({
                    success: false,
                    error: { message: "Invalid module ID" },
                });
                return;
            }
        }
        const material = await DB_Config_1.default.material.create({
            data: {
                title,
                description,
                type: type,
                content,
                fileUrl,
                orderIndex: orderIndex || 0,
                courseId,
                moduleId: moduleId || null,
                authorId: req.user.id,
                isPublic,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                module: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: { material },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.CreateMaterial = CreateMaterial;
const UpdateMaterial = async (req, res) => {
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
        const material = await DB_Config_1.default.material.findUnique({
            where: { id },
            include: {
                course: true,
            },
        });
        if (!material) {
            res.status(404).json({
                success: false,
                error: { message: "Material not found" },
            });
            return;
        }
        if (material.course.creatorId !== req.user.id &&
            req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Access denied" },
            });
            return;
        }
        const updatedMaterial = await DB_Config_1.default.material.update({
            where: { id },
            data: updates,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                module: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            data: { material: updatedMaterial },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UpdateMaterial = UpdateMaterial;
const DeleteMaterial = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { id } = req.params;
        const material = await DB_Config_1.default.material.findUnique({
            where: { id },
            include: {
                course: true,
            },
        });
        if (!material) {
            res.status(404).json({
                success: false,
                error: { message: "Material not found" },
            });
            return;
        }
        if (material.course.creatorId !== req.user.id &&
            req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Access denied" },
            });
            return;
        }
        if (material.fileUrl) {
            (0, fileUtils_1.deleteUploadedFile)(material.fileUrl);
        }
        await DB_Config_1.default.material.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: "Material deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.DeleteMaterial = DeleteMaterial;
const CompleteMaterial = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { materialId } = req.params;
        const material = await DB_Config_1.default.material.findUnique({
            where: { id: materialId },
            include: {
                course: true,
            },
        });
        if (!material) {
            res.status(404).json({
                success: false,
                error: { message: "Material not found" },
            });
            return;
        }
        const enrollment = await DB_Config_1.default.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: req.user.id,
                    courseId: material.courseId,
                },
            },
        });
        if (!enrollment) {
            res.status(403).json({
                success: false,
                error: { message: "Not enrolled in this course" },
            });
            return;
        }
        const existingProgress = await DB_Config_1.default.progress.findFirst({
            where: {
                studentId: req.user.id,
                courseId: material.courseId,
                materialId: materialId,
            },
        });
        if (existingProgress) {
            res.status(400).json({
                success: false,
                error: { message: "Material already completed" },
            });
            return;
        }
        const progress = await DB_Config_1.default.progress.create({
            data: {
                studentId: req.user.id,
                courseId: material.courseId,
                materialId: materialId,
                isCompleted: true,
            },
        });
        res.status(201).json({
            success: true,
            data: { progress },
            message: "Material marked as completed",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.CompleteMaterial = CompleteMaterial;
