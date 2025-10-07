"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delete_File_Local = exports.Upload_Files_Local = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Upload_Files_Local = async (folder, file) => {
    try {
        if (!file)
            return null;
        // Create uploads directory if it doesn't exist
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', folder);
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        // Generate unique filename
        const sanitizedFileName = (file.originalname || 'file')
            .replace(/[^a-zA-Z0-9.\-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        const fileName = `${Date.now()}-${sanitizedFileName}`;
        const filePath = path_1.default.join(uploadDir, fileName);
        // Save file to local storage
        const startTime = Date.now();
        fs_1.default.writeFileSync(filePath, file.buffer);
        const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`💾 Local storage: Saved ${file.originalname} (${fileSizeMB} MB) in ${uploadTime}s`);
        // Return URL for local access
        const baseUrl = process.env.LOCAL_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
        const fileUrl = `${baseUrl}/uploads/${folder}/${fileName}`;
        console.log(`📁 Local file URL: ${fileUrl}`);
        return fileUrl;
    }
    catch (error) {
        console.error('❌ Local storage error:', error.message);
        return null;
    }
};
exports.Upload_Files_Local = Upload_Files_Local;
const Delete_File_Local = async (folder, fileUrl) => {
    try {
        if (!fileUrl)
            return false;
        // Extract filename from URL
        const fileName = path_1.default.basename(fileUrl);
        const filePath = path_1.default.join(process.cwd(), 'uploads', folder, fileName);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            console.log(`🗑️ Deleted local file: ${fileName}`);
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('❌ Local delete error:', error.message);
        return false;
    }
};
exports.Delete_File_Local = Delete_File_Local;
