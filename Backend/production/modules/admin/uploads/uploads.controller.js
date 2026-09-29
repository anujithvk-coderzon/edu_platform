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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAdminAvatar = exports.getFileInfo = exports.deleteUploadedFile = exports.uploadMaterial = exports.uploadCourseThumbnail = exports.uploadMultipleFiles = exports.uploadSingleFile = void 0;
const Errors_1 = require("../../../errors/Errors");
const uploadsService = __importStar(require("./uploads.service"));
const uploads_validation_1 = require("./uploads.validation");
/**
 * HTTP only: check the multipart payload, call a service, shape the response.
 * No Prisma, no try/catch — Express 5 forwards throws to errorHandler.
 */
const parse = (schema, value) => {
    const result = schema.safeParse(value);
    if (!result.success)
        throw result.error;
    return result.data;
};
/** The staff member behind the request; role decides Admin vs Tutor reach. */
const caller = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return { id: req.user.id, role: req.user.role };
};
const uploadSingleFile = async (req, res) => {
    caller(req); // authenticated staff only
    if (!req.file) {
        throw new Errors_1.BadRequestError("No file uploaded");
    }
    const data = await uploadsService.uploadSingleFileService(req.file);
    return res.json({ success: true, data });
};
exports.uploadSingleFile = uploadSingleFile;
const uploadMultipleFiles = async (req, res) => {
    caller(req); // authenticated staff only
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new Errors_1.BadRequestError("No files uploaded");
    }
    const data = await uploadsService.uploadMultipleFilesService(req.files);
    return res.json({ success: true, data });
};
exports.uploadMultipleFiles = uploadMultipleFiles;
const uploadCourseThumbnail = async (req, res) => {
    if (!req.file) {
        throw new Errors_1.BadRequestError("No thumbnail file uploaded");
    }
    const { courseId } = parse(uploads_validation_1.courseIdBodySchema, req.body);
    const data = await uploadsService.uploadCourseThumbnailService(caller(req), req.file, courseId);
    return res.json({ success: true, data });
};
exports.uploadCourseThumbnail = uploadCourseThumbnail;
const uploadMaterial = async (req, res) => {
    if (!req.file) {
        throw new Errors_1.BadRequestError("No material file uploaded");
    }
    const { courseId } = parse(uploads_validation_1.courseIdBodySchema, req.body);
    const data = await uploadsService.uploadMaterialService(caller(req), req.file, courseId);
    return res.json({ success: true, data });
};
exports.uploadMaterial = uploadMaterial;
const deleteUploadedFile = async (req, res) => {
    caller(req); // authenticated staff only
    const { filename } = req.params;
    await uploadsService.deleteUploadedFileService(filename);
    // No `data` block here — the original replied with a bare message.
    return res.json({
        success: true,
        message: "File deleted successfully",
    });
};
exports.deleteUploadedFile = deleteUploadedFile;
const getFileInfo = async (req, res) => {
    caller(req); // authenticated staff only
    const { filename } = req.params;
    const data = await uploadsService.getFileInfoService(filename);
    return res.json({ success: true, data });
};
exports.getFileInfo = getFileInfo;
const uploadAdminAvatar = async (req, res) => {
    if (!req.file) {
        throw new Errors_1.BadRequestError("No avatar file uploaded");
    }
    const data = await uploadsService.uploadAdminAvatarService(caller(req).id, req.file);
    return res.json({
        success: true,
        data,
        message: "Avatar uploaded successfully",
    });
};
exports.uploadAdminAvatar = uploadAdminAvatar;
