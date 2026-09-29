"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const multer_1 = require("../../../lib/multer");
const uploads_controller_1 = require("./uploads.controller");
/** Mounted at /api/admin/uploads — paths unchanged. */
const router = (0, express_1.Router)();
// Each route names the multipart field the admin UI posts under; the field
// names are part of the contract and must not be renamed.
router.post("/single", auth_1.authMiddleware, multer_1.upload.single("file"), uploads_controller_1.uploadSingleFile);
router.post("/multiple", auth_1.authMiddleware, multer_1.upload.array("files", 5), uploads_controller_1.uploadMultipleFiles);
router.post("/avatar", auth_1.authMiddleware, multer_1.upload_avatar, uploads_controller_1.uploadAdminAvatar);
router.post("/course-thumbnail", auth_1.authMiddleware, multer_1.upload.single("thumbnail"), uploads_controller_1.uploadCourseThumbnail);
router.post("/material", auth_1.authMiddleware, multer_1.upload.single("file"), uploads_controller_1.uploadMaterial);
// Legacy on-disk helpers.
router.delete("/file/:filename", auth_1.authMiddleware, uploads_controller_1.deleteUploadedFile);
router.get("/file-info/:filename", auth_1.authMiddleware, uploads_controller_1.getFileInfo);
exports.default = router;
