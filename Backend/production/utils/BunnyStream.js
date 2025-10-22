"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoPlayerUrl = exports.getVideoEmbedUrl = exports.isVideoFile = exports.uploadVideoComplete = exports.uploadVideoToBunnyStream = exports.createVideoMetadata = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Step 1: Create video metadata in Bunny Stream
 * This creates a placeholder for the video and returns a GUID
 *
 * @param title - The title of the video
 * @returns The video GUID and full metadata
 */
const createVideoMetadata = async (title) => {
    const streamApiKey = process.env.BUNNY_STREAM_API;
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    try {
        if (!streamApiKey || !libraryId) {
            throw new Error("Bunny Stream environment variables not set");
        }
        console.log(`📹 Creating video metadata for: ${title}`);
        console.log(`📚 Library ID: ${libraryId}`);
        const url = `https://video.bunnycdn.com/library/${libraryId}/videos`;
        const response = await axios_1.default.post(url, { title }, {
            headers: {
                AccessKey: streamApiKey,
                "Content-Type": "application/json",
            },
        });
        if (response.status >= 200 && response.status < 300 && response.data) {
            const { guid } = response.data;
            console.log(`✅ Video metadata created successfully`);
            console.log(`🎬 Video GUID: ${guid}`);
            return {
                guid,
                metadata: response.data
            };
        }
        else {
            console.error(`❌ Failed to create video metadata. Status: ${response.status}`);
            return null;
        }
    }
    catch (error) {
        console.error("❌ Error creating video metadata:");
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
        else if (error.request) {
            console.error("No response received:", error.request);
        }
        else {
            console.error("Error message:", error.message);
        }
        return null;
    }
};
exports.createVideoMetadata = createVideoMetadata;
/**
 * Step 2: Upload video file to Bunny Stream using the GUID
 *
 * @param guid - The video GUID obtained from createVideoMetadata
 * @param file - The video file buffer from multer
 * @returns True if upload successful, false otherwise
 */
const uploadVideoToBunnyStream = async (guid, file) => {
    const streamApiKey = process.env.BUNNY_STREAM_API;
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    const startTime = Date.now();
    try {
        if (!streamApiKey || !libraryId) {
            throw new Error("Bunny Stream environment variables not set");
        }
        const url = `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`;
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`📤 Starting video upload: ${file.originalname} (${fileSizeMB} MB)`);
        console.log(`🎬 Video GUID: ${guid}`);
        console.log(`⏱️  Upload started at: ${new Date().toISOString()}`);
        let lastProgressTime = Date.now();
        let lastProgressPercent = 0;
        const response = await axios_1.default.put(url, file.buffer, {
            headers: {
                AccessKey: streamApiKey,
                "Content-Type": file.mimetype || "video/mp4",
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 1800000, // 30 minutes for large video files
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    const currentTime = Date.now();
                    const timeSinceLastProgress = currentTime - lastProgressTime;
                    // Log progress every 5% or every 5 seconds
                    if ((percentCompleted >= lastProgressPercent + 5 || timeSinceLastProgress > 5000) &&
                        percentCompleted > lastProgressPercent) {
                        const bytesUploaded = progressEvent.loaded - (lastProgressPercent * progressEvent.total / 100);
                        const speedMBps = (bytesUploaded / (1024 * 1024)) / (timeSinceLastProgress / 1000);
                        const remainingBytes = progressEvent.total - progressEvent.loaded;
                        const estimatedSecondsRemaining = remainingBytes / (bytesUploaded / (timeSinceLastProgress / 1000));
                        console.log(`📊 Video Upload: ${percentCompleted}% | Speed: ${speedMBps.toFixed(2)} MB/s | ETA: ${Math.round(estimatedSecondsRemaining)}s`);
                        lastProgressTime = currentTime;
                        lastProgressPercent = percentCompleted;
                    }
                }
            },
        });
        if (response.status >= 200 && response.status < 300) {
            const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
            const avgSpeed = (file.size / (1024 * 1024) / parseFloat(uploadTime)).toFixed(2);
            console.log(`✅ Video upload completed in ${uploadTime}s (avg ${avgSpeed} MB/s)`);
            console.log(`🎬 Video GUID stored: ${guid}`);
            console.log(`⚙️  Video is now being processed by Bunny Stream`);
            return true;
        }
        else {
            console.error(`❌ Video upload failed with status ${response.status}: ${response.statusText}`);
            return false;
        }
    }
    catch (error) {
        console.error("❌ Bunny Stream video upload error:");
        if (error.code === "ECONNABORTED") {
            console.error("Upload timeout - video file may be too large or connection too slow");
        }
        else if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
        else if (error.request) {
            console.error("No response received:", error.request);
        }
        else {
            console.error("Error message:", error.message);
        }
        return false;
    }
};
exports.uploadVideoToBunnyStream = uploadVideoToBunnyStream;
/**
 * Complete video upload process (metadata creation + file upload)
 * This is a convenience function that combines both steps
 *
 * @param title - The title of the video
 * @param file - The video file buffer from multer
 * @returns The video GUID if successful, null otherwise
 */
const uploadVideoComplete = async (title, file) => {
    try {
        console.log(`🎬 Starting complete video upload process for: ${title}`);
        // Step 1: Create video metadata
        const metadataResult = await (0, exports.createVideoMetadata)(title);
        if (!metadataResult || !metadataResult.guid) {
            console.error("❌ Failed to create video metadata");
            return null;
        }
        const { guid } = metadataResult;
        // Step 2: Upload video file
        const uploadSuccess = await (0, exports.uploadVideoToBunnyStream)(guid, file);
        if (!uploadSuccess) {
            console.error("❌ Failed to upload video file");
            return null;
        }
        console.log(`✅ Complete video upload successful. GUID: ${guid}`);
        return guid;
    }
    catch (error) {
        console.error("❌ Error in complete video upload:", error);
        return null;
    }
};
exports.uploadVideoComplete = uploadVideoComplete;
/**
 * Check if a file is a video based on mimetype
 *
 * @param mimetype - The mimetype of the file
 * @returns True if the file is a video
 */
const isVideoFile = (mimetype) => {
    const videoMimetypes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/webm',
        'video/ogg',
        'video/3gpp',
        'video/3gpp2',
        'video/x-flv',
        'video/x-matroska'
    ];
    return videoMimetypes.includes(mimetype) || mimetype.startsWith('video/');
};
exports.isVideoFile = isVideoFile;
/**
 * Get video embed URL from GUID
 *
 * @param guid - The video GUID
 * @returns The embed URL
 */
const getVideoEmbedUrl = (guid) => {
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}`;
};
exports.getVideoEmbedUrl = getVideoEmbedUrl;
/**
 * Get video player URL from GUID
 *
 * @param guid - The video GUID
 * @returns The player URL
 */
const getVideoPlayerUrl = (guid) => {
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    return `https://iframe.mediadelivery.net/play/${libraryId}/${guid}`;
};
exports.getVideoPlayerUrl = getVideoPlayerUrl;
