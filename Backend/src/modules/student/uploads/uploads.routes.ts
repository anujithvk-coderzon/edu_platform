import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { upload_avatar } from "../../../lib/multer";
import { uploadAvatar } from "./uploads.controller";

/** Mounted at /api/student/uploads — paths unchanged. */
const router = Router();

router.post("/avatar", authMiddleware, upload_avatar, uploadAvatar);

export default router;
