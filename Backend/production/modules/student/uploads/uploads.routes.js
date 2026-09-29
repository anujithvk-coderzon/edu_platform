"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const multer_1 = require("../../../lib/multer");
const uploads_controller_1 = require("./uploads.controller");
/** Mounted at /api/student/uploads — paths unchanged. */
const router = (0, express_1.Router)();
router.post("/avatar", auth_1.authMiddleware, multer_1.upload_avatar, uploads_controller_1.uploadAvatar);
exports.default = router;
