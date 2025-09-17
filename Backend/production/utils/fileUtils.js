"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMultipleFiles = exports.deleteUploadedFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const deleteUploadedFile = (fileUrl) => {
    try {
        if (!fileUrl)
            return false;
        // Extract filename from URL (e.g., '/uploads/filename.mp4' -> 'filename.mp4')
        const filename = path_1.default.basename(fileUrl);
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const filePath = path_1.default.join(uploadDir, filename);
        // Check if file exists and delete it
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            console.log(`✅ File deleted: ${filePath}`);
            return true;
        }
        else {
            console.log(`⚠️ File not found, skipping deletion: ${filePath}`);
            return false;
        }
    }
    catch (error) {
        console.error('❌ Error deleting file:', error);
        return false;
    }
};
exports.deleteUploadedFile = deleteUploadedFile;
const deleteMultipleFiles = (fileUrls) => {
    let deletedCount = 0;
    for (const fileUrl of fileUrls) {
        if ((0, exports.deleteUploadedFile)(fileUrl)) {
            deletedCount++;
        }
    }
    return deletedCount;
};
exports.deleteMultipleFiles = deleteMultipleFiles;
