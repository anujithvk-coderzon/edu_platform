"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Upload_Files_Stream = void 0;
const axios_1 = __importDefault(require("axios"));
const stream_1 = require("stream");
const Upload_Files_Stream = async (folder, file) => {
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
        const sanitizedFileName = (file.originalname || 'file')
            .replace(/[^a-zA-Z0-9.\-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        const fileName = `${Date.now()}-${sanitizedFileName}`;
        const remotePath = `${folder}/${fileName}`;
        const url = `https://storage.bunnycdn.com/${StorageZone}/${remotePath}`;
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`📤 Starting streaming upload: ${file.originalname} (${fileSizeMB} MB, ${file.mimetype})`);
        console.log(`⏱️  Upload started at: ${new Date().toISOString()}`);
        // Create a readable stream from the buffer
        const stream = stream_1.Readable.from(file.buffer);
        // For very large files, use streaming with chunked transfer encoding
        const response = await (0, axios_1.default)({
            method: 'PUT',
            url: url,
            data: stream,
            headers: {
                'AccessKey': Api_key,
                'Content-Type': file.mimetype || 'application/octet-stream',
                'Content-Length': file.size,
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 0, // No timeout for streaming
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    const elapsedSeconds = (Date.now() - startTime) / 1000;
                    const speedMBps = (progressEvent.loaded / (1024 * 1024)) / elapsedSeconds;
                    // Log progress every 10%
                    if (percentCompleted % 10 === 0) {
                        console.log(`📊 Upload progress: ${percentCompleted}% | Speed: ${speedMBps.toFixed(2)} MB/s`);
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
        const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Upload failed after ${uploadTime}s for ${file.originalname}:`);
        if (error.code === 'ECONNABORTED') {
            console.error("Upload timeout - file may be too large or connection too slow");
        }
        else if (error.code === 'ECONNRESET') {
            console.error("Connection reset - server closed connection. File may be too large.");
        }
        else if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
        else if (error.request) {
            console.error("No response received");
        }
        else {
            console.error("Error:", error.message);
        }
        return null;
    }
};
exports.Upload_Files_Stream = Upload_Files_Stream;
