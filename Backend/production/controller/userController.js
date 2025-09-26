"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllTutors = exports.GetUserStats = exports.DeleteUser = exports.UpdateUser = exports.GetUserById = exports.GetAllUsers = void 0;
const express_validator_1 = require("express-validator");
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const GetAllUsers = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Admin access required" },
            });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const where = search
            ? {
                OR: [
                    { email: { contains: search, mode: "insensitive" } },
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                ],
            }
            : {};
        const [tutors, total] = await Promise.all([
            DB_Config_1.default.admin.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            DB_Config_1.default.admin.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            data: {
                users: tutors,
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
exports.GetAllUsers = GetAllUsers;
const GetUserById = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Admin access required" },
            });
            return;
        }
        const { id } = req.params;
        const user = await DB_Config_1.default.admin.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        createdCourses: true,
                    },
                },
            },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: "User not found" },
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.GetUserById = GetUserById;
const UpdateUser = async (req, res) => {
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
        const updates = req.body;
        delete updates.password;
        delete updates.email;
        delete updates.role;
        const user = await DB_Config_1.default.admin.update({
            where: { id },
            data: updates,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
        res.status(200).json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({
                success: false,
                error: { message: "User not found" },
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UpdateUser = UpdateUser;
const DeleteUser = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Admin access required" },
            });
            return;
        }
        const { id } = req.params;
        await DB_Config_1.default.admin.delete({
            where: { id },
        });
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({
                success: false,
                error: { message: "User not found" },
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.DeleteUser = DeleteUser;
const GetUserStats = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                error: { message: "Admin access required" },
            });
            return;
        }
        const [totalAdmins, totalTutors, totalStudents, totalCourses] = await Promise.all([
            DB_Config_1.default.admin.count(),
            DB_Config_1.default.admin.count(),
            DB_Config_1.default.student.count(),
            DB_Config_1.default.course.count(),
        ]);
        const recentUsers = await DB_Config_1.default.admin.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true,
            },
        });
        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalAdmins,
                    totalTutors,
                    totalStudents,
                    totalCourses,
                    totalUsers: totalAdmins + totalTutors + totalStudents,
                },
                recentUsers,
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
exports.GetUserStats = GetUserStats;
const GetAllTutors = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const where = search
            ? {
                OR: [
                    { email: { contains: search, mode: "insensitive" } },
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                ],
            }
            : {};
        const [tutors, total] = await Promise.all([
            DB_Config_1.default.admin.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    _count: {
                        select: {
                            createdCourses: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            DB_Config_1.default.admin.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            data: {
                tutors,
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
exports.GetAllTutors = GetAllTutors;
