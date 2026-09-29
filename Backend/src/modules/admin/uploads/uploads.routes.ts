import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { upload, upload_avatar } from "../../../lib/multer";
import {
  deleteUploadedFile,
  getFileInfo,
  uploadAdminAvatar,
  uploadCourseThumbnail,
  uploadMaterial,
  uploadMultipleFiles,
  uploadSingleFile,
} from "./uploads.controller";

/** Mounted at /api/admin/uploads — paths unchanged. */
const router = Router();

// Each route names the multipart field the admin UI posts under; the field
// names are part of the contract and must not be renamed.
router.post("/single", authMiddleware, upload.single("file"), uploadSingleFile);
router.post("/multiple", authMiddleware, upload.array("files", 5), uploadMultipleFiles);
router.post("/avatar", authMiddleware, upload_avatar, uploadAdminAvatar);
router.post(
  "/course-thumbnail",
  authMiddleware,
  upload.single("thumbnail"),
  uploadCourseThumbnail,
);
router.post("/material", authMiddleware, upload.single("file"), uploadMaterial);

// Legacy on-disk helpers.
router.delete("/file/:filename", authMiddleware, deleteUploadedFile);
router.get("/file-info/:filename", authMiddleware, getFileInfo);

export default router;
