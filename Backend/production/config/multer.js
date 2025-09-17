"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileUrl = exports.deleteUploadedFile = exports.uploadAny = exports.uploadThumbnail = exports.uploadDocument = exports.uploadVideo = exports.uploadImage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure upload directories exist
const uploadDirs = {
    images: path_1.default.join(__dirname, '../uploads/images'),
    videos: path_1.default.join(__dirname, '../uploads/videos'),
    documents: path_1.default.join(__dirname, '../uploads/documents'),
    thumbnails: path_1.default.join(__dirname, '../uploads/thumbnails'),
};
Object.values(uploadDirs).forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
});
// File filter for different types
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed!'));
    }
};
const videoFilter = (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|mkv|webm/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = /video/.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only video files are allowed!'));
    }
};
const documentFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|ppt|pptx|xls|xlsx/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    if (extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Invalid document format!'));
    }
};
// Storage configuration
const createStorage = (type) => {
    return multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDirs[type]);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            cb(null, `${uniqueSuffix}-${sanitizedFilename}`);
        }
    });
};
// Multer configurations for different file types
exports.uploadImage = (0, multer_1.default)({
    storage: createStorage('images'),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: imageFilter
});
exports.uploadVideo = (0, multer_1.default)({
    storage: createStorage('videos'),
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
    },
    fileFilter: videoFilter
});
exports.uploadDocument = (0, multer_1.default)({
    storage: createStorage('documents'),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: documentFilter
});
exports.uploadThumbnail = (0, multer_1.default)({
    storage: createStorage('thumbnails'),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    },
    fileFilter: imageFilter
});
// Generic upload for any file type
exports.uploadAny = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            // Determine destination based on file type
            if (/image/.test(file.mimetype)) {
                cb(null, uploadDirs.images);
            }
            else if (/video/.test(file.mimetype)) {
                cb(null, uploadDirs.videos);
            }
            else {
                cb(null, uploadDirs.documents);
            }
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            cb(null, `${uniqueSuffix}-${sanitizedFilename}`);
        }
    }),
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max
    }
});
// Helper function to delete uploaded files
const deleteUploadedFile = async (filePath) => {
    try {
        const fullPath = path_1.default.join(__dirname, '..', filePath);
        if (fs_1.default.existsSync(fullPath)) {
            fs_1.default.unlinkSync(fullPath);
            console.log(`File deleted: ${fullPath}`);
        }
    }
    catch (error) {
        console.error(`Error deleting file: ${filePath}`, error);
    }
};
exports.deleteUploadedFile = deleteUploadedFile;
// Helper to get file URL
const getFileUrl = (req, filePath) => {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/${filePath}`;
};
exports.getFileUrl = getFileUrl;
