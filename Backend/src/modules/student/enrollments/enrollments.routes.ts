import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth";
import {
  enrollInCourse,
  getEnrollmentProgress,
  listMyEnrollments,
} from "./enrollments.controller";

/** Mounted at /api/student — paths unchanged. */
const router = Router();

router.get("/my-enrollments", authMiddleware, listMyEnrollments);
router.post("/enroll", authMiddleware, enrollInCourse);
router.get("/progress/:courseId", authMiddleware, getEnrollmentProgress);

export default router;
