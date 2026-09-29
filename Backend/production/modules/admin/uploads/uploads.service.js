"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAdminAvatarService = exports.getFileInfoService = exports.deleteUploadedFileService = exports.uploadMaterialService = exports.uploadCourseThumbnailService = exports.uploadMultipleFilesService = exports.uploadSingleFileService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const cdnStorage_1 = require("../../../lib/cdnStorage");
const cdnStreaming_1 = require("../../../lib/cdnStreaming");
const localStorage_1 = require("../../../lib/localStorage");
const bunnyStream_1 = require("../../../lib/bunnyStream");
/** Bunny CDN switches to a streaming PUT above this size. */
const STREAM_THRESHOLD_BYTES = 20 * 1024 * 1024;
/** Where the legacy disk-backed endpoints (delete / info) look for files. */
const uploadDir = () => process.env.UPLOAD_DIR || "./uploads";
/**
 * Legacy disk-backed responses.
 *
 * Multer is configured with `memoryStorage`, so `filename` and `path` are
 * undefined on the incoming file. That is pre-existing behaviour of these two
 * endpoints and the shape below reproduces it verbatim — the admin UI reads
 * `url` and `originalName` only.
 */
const uploadSingleFileService = async (file) => {
    const fileUrl = `/uploads/${file.filename}`;
    return {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: fileUrl,
        path: file.path,
    };
};
exports.uploadSingleFileService = uploadSingleFileService;
const uploadMultipleFilesService = async (files) => {
    const uploadedFiles = files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        path: file.path,
    }));
    return { files: uploadedFiles };
};
exports.uploadMultipleFilesService = uploadMultipleFilesService;
/**
 * Course thumbnail upload.
 *
 * The file always lands on the CDN first; only then is the optional
 * `courseId` resolved, so an upload with no course attached still returns a
 * usable `url` for the create-course form to hold on to.
 */
const uploadCourseThumbnailService = async (caller, file, courseId) => {
    if (!file.mimetype.startsWith("image/")) {
        throw new Errors_1.BadRequestError("Thumbnail must be an image file");
    }
    // Upload file to CDN in images folder
    const thumbnailUrl = await (0, cdnStorage_1.Upload_Files)("images", file);
    if (!thumbnailUrl) {
        throw new Errors_1.InternalServerError("Failed to upload thumbnail to CDN");
    }
    if (!courseId) {
        return {
            filename: file.originalname,
            url: thumbnailUrl,
        };
    }
    const course = await prisma_1.default.course.findUnique({
        where: { id: courseId },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    if (course.creatorId !== caller.id && caller.role !== "Admin") {
        throw new Errors_1.ForbiddenError("Not authorized to update this course");
    }
    // Get current course to check for existing thumbnail
    const currentCourse = await prisma_1.default.course.findUnique({
        where: { id: courseId },
        select: { thumbnail: true },
    });
    // Delete old thumbnail from CDN if it exists. `thumbnail` is read straight
    // from the database here, so it is the bare relative CDN path Delete_File
    // expects — never an absolute URL rebuilt by the media middleware.
    if (currentCourse?.thumbnail) {
        await (0, cdnStorage_1.Delete_File)(currentCourse.thumbnail);
    }
    await prisma_1.default.course.update({
        where: { id: courseId },
        data: { thumbnail: thumbnailUrl },
    });
    return {
        filename: file.originalname,
        url: thumbnailUrl,
        message: "Course thumbnail updated successfully",
    };
};
exports.uploadCourseThumbnailService = uploadCourseThumbnailService;
/**
 * Course material upload.
 *
 * Two destinations, and which one is used decides what `fileUrl` means:
 *
 *  - videos go to Bunny Stream and `fileUrl` is the bare video GUID (no
 *    scheme, no slashes) — the player resolves it later,
 *  - everything else goes to Bunny CDN Storage and `fileUrl` is a bare
 *    relative path (`materials/...`).
 *
 * `fileUrl` and `url` carry the same value on purpose: the create-course page
 * reads `.fileUrl` while the course-edit page reads `.url`, so both keys have
 * to stay.
 */
const uploadMaterialService = async (caller, file, courseId) => {
    // Log file details for debugging
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Processing upload: ${file.originalname} (${fileSizeMB} MB, ${file.mimetype})`);
    // If courseId is provided, verify user has access
    if (courseId) {
        const course = await prisma_1.default.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new Errors_1.NotFoundError("Course not found");
        }
        // Access control: Admin can upload to any course, Tutors can upload to
        // courses they created or are assigned to.
        if (caller.role !== "Admin") {
            const hasAccess = course.creatorId === caller.id || course.tutorId === caller.id;
            if (!hasAccess) {
                throw new Errors_1.ForbiddenError("Not authorized to upload materials for this course");
            }
        }
    }
    // Check if the file is a video
    const isVideo = (0, bunnyStream_1.isVideoFile)(file.mimetype);
    let fileUrl = null;
    let isVideoMaterial = false;
    if (isVideo) {
        // Upload video to Bunny Stream
        console.log("🎬 Detected video file - uploading to Bunny Stream");
        const videoTitle = file.originalname.replace(/\.[^/.]+$/, ""); // Remove file extension
        const videoGuid = await (0, bunnyStream_1.uploadVideoComplete)(videoTitle, file);
        if (!videoGuid) {
            throw new Errors_1.InternalServerError("Failed to upload video to Bunny Stream");
        }
        fileUrl = videoGuid; // Store the GUID as the fileUrl
        isVideoMaterial = true;
        console.log(`✅ Video uploaded successfully. GUID: ${videoGuid}`);
    }
    else {
        // Upload non-video files to Bunny CDN Storage
        console.log("📄 Uploading non-video file to Bunny CDN Storage");
        if (process.env.NODE_ENV === "development" && process.env.USE_LOCAL_STORAGE === "true") {
            // Use local storage for development
            console.log("📂 Using local storage for development");
            fileUrl = await (0, localStorage_1.Upload_Files_Local)("materials", file);
        }
        else {
            // Use Bunny CDN for production or when explicitly configured
            console.log("☁️ Using Bunny CDN storage");
            fileUrl =
                file.size > STREAM_THRESHOLD_BYTES
                    ? await (0, cdnStreaming_1.Upload_Files_Stream)("materials", file)
                    : await (0, cdnStorage_1.Upload_Files)("materials", file);
        }
        if (!fileUrl) {
            throw new Errors_1.InternalServerError("Failed to upload material to CDN");
        }
    }
    return {
        filename: file.originalname,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fileUrl: fileUrl,
        url: fileUrl,
        isVideo: isVideoMaterial,
        ...(isVideoMaterial && {
            message: "Video uploaded successfully. It will take some time to process.",
        }),
    };
};
exports.uploadMaterialService = uploadMaterialService;
/** Removes a file from the legacy on-disk upload directory. */
const deleteUploadedFileService = async (filename) => {
    const filePath = path_1.default.join(uploadDir(), filename);
    if (!fs_1.default.existsSync(filePath)) {
        throw new Errors_1.NotFoundError("File not found");
    }
    try {
        fs_1.default.unlinkSync(filePath);
    }
    catch (error) {
        throw new Errors_1.InternalServerError("Failed to delete file");
    }
};
exports.deleteUploadedFileService = deleteUploadedFileService;
/** Stats for a file in the legacy on-disk upload directory. */
const getFileInfoService = async (filename) => {
    const filePath = path_1.default.join(uploadDir(), filename);
    if (!fs_1.default.existsSync(filePath)) {
        throw new Errors_1.NotFoundError("File not found");
    }
    const stats = fs_1.default.statSync(filePath);
    const extension = path_1.default.extname(filename);
    return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        extension,
        url: `/uploads/${filename}`,
    };
};
exports.getFileInfoService = getFileInfoService;
/**
 * Admin avatar upload.
 *
 * The previous avatar is read *before* the new one is uploaded, and only
 * removed once the replacement is safely on the CDN — a failed delete never
 * fails the upload. The stored value is the bare relative CDN path that
 * Delete_File needs, so it is passed through untouched.
 */
const uploadAdminAvatarService = async (adminId, file) => {
    // Get current admin to check for existing avatar
    const currentAdmin = await prisma_1.default.admin.findUnique({
        where: { id: adminId },
        select: { avatar: true },
    });
    // Upload new avatar to CDN
    console.log("☁️ Uploading new avatar to CDN");
    const avatarUrl = await (0, cdnStorage_1.Upload_Files)("avatars", file);
    if (!avatarUrl) {
        throw new Errors_1.InternalServerError("Failed to upload avatar to CDN");
    }
    // Delete old avatar from CDN if it exists
    if (currentAdmin?.avatar) {
        try {
            console.log("🗑️ Deleting old avatar from CDN:", currentAdmin.avatar);
            const deleted = await (0, cdnStorage_1.Delete_File)(currentAdmin.avatar);
            if (deleted) {
                console.log("✅ Successfully deleted old avatar");
            }
            else {
                console.log("⚠️ Failed to delete old avatar");
            }
        }
        catch (error) {
            console.error("❌ Error deleting old avatar:", error);
        }
    }
    // Update admin avatar in database
    const updatedAdmin = await prisma_1.default.admin.update({
        where: { id: adminId },
        data: { avatar: avatarUrl },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            updatedAt: true,
        },
    });
    return {
        user: updatedAdmin,
        url: avatarUrl,
    };
};
exports.uploadAdminAvatarService = uploadAdminAvatarService;
