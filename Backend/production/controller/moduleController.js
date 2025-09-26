"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReorderModule = exports.DeleteModule = exports.UpdateModule = exports.CreateModule = exports.GetModuleById = exports.GetCourseModules = void 0;
const express_validator_1 = require("express-validator");
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const GetCourseModules = async (req, res) => {
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
        const modules = await DB_Config_1.default.courseModule.findMany({
            where: { courseId },
            include: {
                materials: {
                    orderBy: { orderIndex: "asc" },
                },
            },
            orderBy: { orderIndex: "asc" },
        });
        res.json({
            success: true,
            data: { modules },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetCourseModules = GetCourseModules;
const GetModuleById = async (req, res) => {
    try {
        const { id } = req.params;
        const module = await DB_Config_1.default.courseModule.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        creatorId: true,
                    },
                },
                materials: {
                    orderBy: { orderIndex: "asc" },
                },
            },
        });
        if (!module) {
            res.status(404).json({
                success: false,
                error: { message: "Module not found" },
            });
            return;
        }
        res.json({
            success: true,
            data: { module },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetModuleById = GetModuleById;
const CreateModule = async (req, res) => {
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
        const { title, description, courseId, orderIndex } = req.body;
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
        const module = await DB_Config_1.default.courseModule.create({
            data: {
                title,
                description,
                courseId,
                orderIndex: orderIndex || 0,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: { module },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.CreateModule = CreateModule;
const UpdateModule = async (req, res) => {
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
        const module = await DB_Config_1.default.courseModule.findUnique({
            where: { id },
            include: {
                course: true,
            },
        });
        if (!module) {
            res.status(404).json({
                success: false,
                error: { message: "Module not found" },
            });
            return;
        }
        if (module.course.creatorId !== req.user.id &&
            req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Access denied" },
            });
            return;
        }
        const updatedModule = await DB_Config_1.default.courseModule.update({
            where: { id },
            data: updates,
            include: {
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
            data: { module: updatedModule },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UpdateModule = UpdateModule;
const DeleteModule = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { id } = req.params;
        const module = await DB_Config_1.default.courseModule.findUnique({
            where: { id },
            include: {
                course: true,
                materials: true,
            },
        });
        if (!module) {
            res.status(404).json({
                success: false,
                error: { message: "Module not found" },
            });
            return;
        }
        if (module.course.creatorId !== req.user.id &&
            req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Access denied" },
            });
            return;
        }
        await DB_Config_1.default.courseModule.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: "Module deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.DeleteModule = DeleteModule;
const ReorderModule = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { id } = req.params;
        const { newOrderIndex } = req.body;
        const module = await DB_Config_1.default.courseModule.findUnique({
            where: { id },
            include: {
                course: true,
            },
        });
        if (!module) {
            res.status(404).json({
                success: false,
                error: { message: "Module not found" },
            });
            return;
        }
        if (module.course.creatorId !== req.user.id &&
            req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Access denied" },
            });
            return;
        }
        const updatedModule = await DB_Config_1.default.courseModule.update({
            where: { id },
            data: { orderIndex: newOrderIndex },
        });
        res.json({
            success: true,
            data: { module: updatedModule },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.ReorderModule = ReorderModule;
