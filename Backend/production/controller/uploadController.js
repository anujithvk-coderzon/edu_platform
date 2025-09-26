"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFileInfo = exports.DeleteUploadedFile = exports.UploadMaterial = exports.UploadCourseThumbnail = exports.UploadAvatar = exports.UploadMultipleFiles = exports.UploadSingleFile = void 0;
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const fileUtils_1 = require("../utils/fileUtils");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const UploadSingleFile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: { message: "No file uploaded" },
            });
            return;
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            success: true,
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                url: fileUrl,
            },
            message: "File uploaded successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UploadSingleFile = UploadSingleFile;
const UploadMultipleFiles = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({
                success: false,
                error: { message: "No files uploaded" },
            });
            return;
        }
        const uploadedFiles = files.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            url: `/uploads/${file.filename}`,
        }));
        res.status(200).json({
            success: true,
            data: { files: uploadedFiles },
            message: "Files uploaded successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UploadMultipleFiles = UploadMultipleFiles;
const UploadAvatar = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: { message: "No file uploaded" },
            });
            return;
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        let updatedUser;
        if (req.user.role === "admin") {
            const currentUser = await DB_Config_1.default.admin.findUnique({
                where: { id: req.user.id },
            });
            if (currentUser?.avatar) {
                (0, fileUtils_1.deleteUploadedFile)(currentUser.avatar);
            }
            updatedUser = await DB_Config_1.default.admin.update({
                where: { id: req.user.id },
                data: { avatar: fileUrl },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                },
            });
        }
        else if (req.user.role === "tutor") {
            const currentUser = await DB_Config_1.default.admin.findUnique({
                where: { id: req.user.id },
            });
            if (currentUser?.avatar) {
                (0, fileUtils_1.deleteUploadedFile)(currentUser.avatar);
            }
            updatedUser = await DB_Config_1.default.admin.update({
                where: { id: req.user.id },
                data: { avatar: fileUrl },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                },
            });
        }
        res.status(200).json({
            success: true,
            data: {
                user: updatedUser,
                file: {
                    filename: req.file.filename,
                    url: fileUrl,
                },
            },
            message: "Avatar updated successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UploadAvatar = UploadAvatar;
const UploadCourseThumbnail = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: { message: "No file uploaded" },
            });
            return;
        }
        const { courseId } = req.params;
        if (courseId) {
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
            const currentCourse = await DB_Config_1.default.course.findUnique({
                where: { id: courseId },
                select: { thumbnail: true },
            });
            if (currentCourse?.thumbnail) {
                (0, fileUtils_1.deleteUploadedFile)(currentCourse.thumbnail);
            }
            const fileUrl = `/uploads/${req.file.filename}`;
            await DB_Config_1.default.course.update({
                where: { id: courseId },
                data: { thumbnail: fileUrl },
            });
            res.status(200).json({
                success: true,
                data: {
                    courseId,
                    thumbnail: fileUrl,
                },
                message: "Course thumbnail updated successfully",
            });
        }
        else {
            const fileUrl = `/uploads/${req.file.filename}`;
            res.status(200).json({
                success: true,
                data: {
                    filename: req.file.filename,
                    url: fileUrl,
                },
                message: "Thumbnail uploaded successfully",
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UploadCourseThumbnail = UploadCourseThumbnail;
const UploadMaterial = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: { message: "No file uploaded" },
            });
            return;
        }
        const { courseId } = req.params;
        if (courseId) {
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
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            success: true,
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                url: fileUrl,
            },
            message: "Material uploaded successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.UploadMaterial = UploadMaterial;
const DeleteUploadedFile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { filename } = req.params;
        if (!filename) {
            res.status(400).json({
                success: false,
                error: { message: "Filename is required" },
            });
            return;
        }
        const filePath = path_1.default.join(process.cwd(), "uploads", filename);
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({
                success: false,
                error: { message: "File not found" },
            });
            return;
        }
        (0, fileUtils_1.deleteUploadedFile)(`/uploads/${filename}`);
        res.status(200).json({
            success: true,
            message: "File deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: "Server error", details: error.message },
        });
    }
};
exports.DeleteUploadedFile = DeleteUploadedFile;
const GetFileInfo = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized" },
            });
            return;
        }
        const { filename } = req.params;
        if (!filename) {
            res.status(400).json({
                success: false,
                error: { message: "Filename is required" },
            });
            return;
        }
        const filePath = path_1.default.join(process.cwd(), "uploads", filename);
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({
                success: false,
                error: { message: "File not found" },
            });
            return;
        }
        const stats = fs_1.default.statSync(filePath);
        res.status(200).json({
            success: true,
            data: {
                file: {
                    filename,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    updatedAt: stats.mtime,
                }
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
exports.GetFileInfo = GetFileInfo;
