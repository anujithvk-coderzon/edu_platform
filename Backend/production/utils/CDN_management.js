"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delete_File = exports.Upload_Files = void 0;
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const Upload_Files = async (folder, file) => {
    const Api_key = process.env.BUNNY_API_KEY;
    const StorageZone = process.env.BUNNY_STORAGE_ZONE;
    const PullZoneHost = process.env.BUNNY_PULL_ZONE_HOST;
    const startTime = Date.now();
    try {
        if (!file)
            return null;
        if (!Api_key || !StorageZone || !PullZoneHost) {
            throw new Error("Bunny Storage environment variables not set");
        }
        // Generate unique file path for Bunny - sanitize filename to remove invalid characters
        const sanitizedFileName = (file.originalname || path_1.default.basename(file.originalname))
            .replace(/[^a-zA-Z0-9.\-_]/g, '-') // Replace invalid chars with hyphen
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
        const fileName = `${Date.now()}-${sanitizedFileName}`;
        const remotePath = `${folder}/${fileName}`;
        const url = `https://storage.bunnycdn.com/${StorageZone}/${remotePath}`;
        // Upload file buffer directly to Bunny
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`📤 Starting upload: ${file.originalname} (${fileSizeMB} MB, ${file.mimetype}) to ${remotePath}`);
        console.log(`⏱️  Upload started at: ${new Date().toISOString()}`);
        let lastProgressTime = Date.now();
        let lastProgressPercent = 0;
        const response = await axios_1.default.put(url, file.buffer, {
            headers: {
                AccessKey: Api_key,
                "Content-Type": file.mimetype || "application/octet-stream",
            },
            maxBodyLength: Infinity,
            timeout: 600000, // Increased to 10 minutes for large files
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    const currentTime = Date.now();
                    const timeSinceLastProgress = currentTime - lastProgressTime;
                    // Calculate upload speed
                    if (timeSinceLastProgress > 1000 && percentCompleted > lastProgressPercent) { // Update every second
                        const bytesUploaded = progressEvent.loaded - (lastProgressPercent * progressEvent.total / 100);
                        const speedMBps = (bytesUploaded / (1024 * 1024)) / (timeSinceLastProgress / 1000);
                        const remainingBytes = progressEvent.total - progressEvent.loaded;
                        const estimatedSecondsRemaining = remainingBytes / (bytesUploaded / (timeSinceLastProgress / 1000));
                        console.log(`📊 Upload: ${percentCompleted}% | Speed: ${speedMBps.toFixed(2)} MB/s | ETA: ${Math.round(estimatedSecondsRemaining)}s`);
                        lastProgressTime = currentTime;
                        lastProgressPercent = percentCompleted;
                    }
                }
            }
        });
        if (response.status >= 200 && response.status < 300) {
            const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
            const avgSpeed = (file.size / (1024 * 1024) / parseFloat(uploadTime)).toFixed(2);
            console.log(`✅ Upload completed in ${uploadTime}s (avg ${avgSpeed} MB/s)`);
            console.log(`📁 File URL: https://${PullZoneHost}/${remotePath}`);
            return `https://${PullZoneHost}/${remotePath}`;
        }
        else {
            console.error(`❌ Upload failed with status ${response.status}: ${response.statusText}`);
            return null;
        }
    }
    catch (error) {
        console.error("❌ Bunny upload error for", file.originalname, ":");
        if (error.code === 'ECONNABORTED') {
            console.error("Upload timeout - file may be too large or connection too slow");
        }
        else if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
            console.error("Response headers:", error.response.headers);
        }
        else if (error.request) {
            console.error("No response received:", error.request);
        }
        else {
            console.error("Error setting up request:", error.message);
        }
        console.error("Full error object:", error);
        return null;
    }
};
exports.Upload_Files = Upload_Files;
const Delete_File = async (folder, file) => {
    const Api_key = process.env.BUNNY_API_KEY;
    const StorageZone = process.env.BUNNY_STORAGE_ZONE;
    try {
        if (!file)
            throw new Error("No remote path provided");
        if (!Api_key || !StorageZone) {
            throw new Error("Bunny Storage environment variables not set");
        }
        const filename = path_1.default.basename(file);
        const url = `https://storage.bunnycdn.com/${StorageZone}/${folder}/${filename}`;
        await axios_1.default.delete(url, {
            headers: {
                AccessKey: Api_key,
            },
        });
        return true;
    }
    catch (error) {
        console.error("Bunny delete error:", error.response?.data || error.message);
        return false;
    }
};
exports.Delete_File = Delete_File;
