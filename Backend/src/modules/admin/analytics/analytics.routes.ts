import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth";
import {
  getCourseCompletion,
  getTutorAnalytics,
} from "./analytics.controller";

/** Mounted at /api/admin/analytics — paths unchanged. */
const router = Router();

router.get("/tutor", authMiddleware, getTutorAnalytics);
router.get("/course/:courseId/completion", authMiddleware, getCourseCompletion);

export default router;
