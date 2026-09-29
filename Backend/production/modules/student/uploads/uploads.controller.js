"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = void 0;
const Errors_1 = require("../../../errors/Errors");
const uploads_service_1 = require("./uploads.service");
const uploadAvatar = async (req, res) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    if (!req.file) {
        throw new Errors_1.BadRequestError("No avatar file uploaded");
    }
    const data = await (0, uploads_service_1.uploadAvatarService)(req.user.id, req.file);
    return res.json({
        success: true,
        data,
        message: "Avatar uploaded successfully",
    });
};
exports.uploadAvatar = uploadAvatar;
