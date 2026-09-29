import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth";
import {
  deleteEnrollment,
  enrollInCourse,
  getCourseStudents,
  getEnrollmentProgress,
  getMyEnrollments,
  updateEnrollmentStatus,
} from "./enrollments.controller";

/** Mounted at /api/admin/enrollments — paths unchanged. */
const router = Router();

// Literal prefixes first, so "/enroll" and friends are not matched as an
// ":enrollmentId".
router.post("/enroll", authMiddleware, enrollInCourse);
router.get("/my-enrollments", authMiddleware, getMyEnrollments);
router.get("/course/:courseId/students", authMiddleware, getCourseStudents);
router.get("/progress/:courseId", authMiddleware, getEnrollmentProgress);

router.put("/:enrollmentId/status", authMiddleware, updateEnrollmentStatus);
router.delete("/:enrollmentId", authMiddleware, deleteEnrollment);

export default router;
