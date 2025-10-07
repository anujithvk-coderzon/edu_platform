"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload_assignment = exports.upload_material = exports.upload_thumbnail = exports.upload_avatar = exports.upload_multiple = exports.upload_single = exports.assignmentUpload = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 200 * 1024 * 1024, // 200MB limit to handle larger audio/video files
    },
    fileFilter: (req, file, cb) => {
        // Log file details for debugging
        console.log(`📁 Multer processing file: ${file.originalname} (${file.mimetype})`);
        // Check for audio files specifically
        if (file.mimetype.startsWith('audio/')) {
            console.log(`🎵 Audio file detected: ${file.originalname}`);
        }
        cb(null, true); // allow all file types
    },
});
// Assignment-specific multer configuration with file type restrictions
exports.assignmentUpload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB for assignments
    },
    fileFilter: (req, file, cb) => {
        console.log(`📋 Assignment file processing: ${file.originalname} (${file.mimetype})`);
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'application/zip'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type ${file.mimetype} is not allowed for assignments`));
        }
    },
});
// Different upload helpers
exports.upload_single = exports.upload.single("file");
exports.upload_multiple = exports.upload.array("files", 10);
exports.upload_avatar = exports.upload.single("avatar");
exports.upload_thumbnail = exports.upload.single("thumbnail");
exports.upload_material = exports.upload.single("material");
exports.upload_assignment = exports.assignmentUpload.single("file");
