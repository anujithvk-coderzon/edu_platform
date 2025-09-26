"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCategory = exports.UpdateCategory = exports.CreateCategory = exports.GetCategoryById = exports.GetAllCategories = void 0;
const express_validator_1 = require("express-validator");
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const GetAllCategories = async (req, res) => {
    try {
        const categories = await DB_Config_1.default.category.findMany({
            include: {
                _count: {
                    select: {
                        courses: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });
        res.json({
            success: true,
            data: { categories },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetAllCategories = GetAllCategories;
const GetCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await DB_Config_1.default.category.findUnique({
            where: { id },
            include: {
                courses: {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                        _count: {
                            select: {
                                enrollments: true,
                                materials: true,
                            },
                        },
                    },
                },
            },
        });
        if (!category) {
            res.status(404).json({
                success: false,
                error: { message: "Category not found" },
            });
            return;
        }
        res.json({
            success: true,
            data: { category },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetCategoryById = GetCategoryById;
const CreateCategory = async (req, res) => {
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
        const { name, description } = req.body;
        const existingCategory = await DB_Config_1.default.category.findUnique({
            where: { name },
        });
        if (existingCategory) {
            res.status(400).json({
                success: false,
                error: { message: "Category already exists" },
            });
            return;
        }
        const category = await DB_Config_1.default.category.create({
            data: {
                name,
                description: description || null,
            },
        });
        res.status(201).json({
            success: true,
            data: { category },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.CreateCategory = CreateCategory;
const UpdateCategory = async (req, res) => {
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
        const { id } = req.params;
        const { name, description } = req.body;
        if (name) {
            const existingCategory = await DB_Config_1.default.category.findFirst({
                where: {
                    name,
                    NOT: { id },
                },
            });
            if (existingCategory) {
                res.status(400).json({
                    success: false,
                    error: { message: "Category name already exists" },
                });
                return;
            }
        }
        const category = await DB_Config_1.default.category.update({
            where: { id },
            data: {
                name,
                description,
            },
        });
        res.json({
            success: true,
            data: { category },
        });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({
                success: false,
                error: { message: "Category not found" },
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UpdateCategory = UpdateCategory;
const DeleteCategory = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Admin access required" },
            });
            return;
        }
        const { id } = req.params;
        const coursesCount = await DB_Config_1.default.course.count({
            where: { categoryId: id },
        });
        if (coursesCount > 0) {
            res.status(400).json({
                success: false,
                error: {
                    message: "Cannot delete category with associated courses",
                },
            });
            return;
        }
        await DB_Config_1.default.category.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: "Category deleted successfully",
        });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({
                success: false,
                error: { message: "Category not found" },
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.DeleteCategory = DeleteCategory;
