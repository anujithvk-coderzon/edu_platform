"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatarService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const cdnStorage_1 = require("../../../lib/cdnStorage");
const localStorage_1 = require("../../../lib/localStorage");
const uploadAvatarService = async (studentId, file) => {
    const current = await prisma_1.default.student.findUnique({
        where: { id: studentId },
        select: { avatar: true },
    });
    const useLocal = process.env.NODE_ENV === "development" || !process.env.BUNNY_API_KEY;
    const avatarUrl = useLocal
        ? await (0, localStorage_1.Upload_Files_Local)("avatars", file)
        : await (0, cdnStorage_1.Upload_Files)("avatars", file);
    // Remove the previous avatar, but never fail the upload over it.
    if (current?.avatar) {
        try {
            await (0, cdnStorage_1.Delete_File)(current.avatar);
        }
        catch (error) {
            console.error("❌ Error deleting old avatar:", error);
        }
    }
    if (!avatarUrl) {
        throw new Errors_1.InternalServerError("Failed to upload avatar to storage");
    }
    const student = await prisma_1.default.student.update({
        where: { id: studentId },
        data: { avatar: avatarUrl },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            updatedAt: true,
        },
    });
    return { url: avatarUrl, user: student };
};
exports.uploadAvatarService = uploadAvatarService;
