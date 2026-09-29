import { Router } from "express";
import { authMiddleware, adminOnly } from "../../../middlewares/auth";
import {
  CleanupOrphanedCourses,
  CreateCourse,
  DeleteCourse,
  GetAllCourses,
  GetAllTutors,
  GetCourseById,
  GetMyCourses,
  GetPendingCourses,
  GetPendingCoursesCount,
  PublishCourse,
  RejectCourse,
  SubmitCourseForReview,
  ToggleTutorStatus,
  UpdateCourse,
} from "./courses.controller";

/**
 * Mounted at /api/admin (not under a /courses prefix) — several of these are
 * siblings of the course paths, so the full paths are declared here.
 *
 * Every literal segment under /courses has to be declared before
 * "/courses/:id", or ":id" captures "my-courses", "pending" and "cleanup".
 */
const router = Router();

router.get("/courses", authMiddleware, GetAllCourses);
router.get("/courses/my-courses", authMiddleware, GetMyCourses);
router.get(
  "/courses/pending/count",
  authMiddleware,
  adminOnly,
  GetPendingCoursesCount,
);
router.get("/courses/pending", authMiddleware, adminOnly, GetPendingCourses);
router.post("/courses/cleanup", authMiddleware, CleanupOrphanedCourses);

router.get("/tutors", authMiddleware, adminOnly, GetAllTutors);
router.put("/admin/tutors/:id/status", authMiddleware, adminOnly, ToggleTutorStatus);

router.get("/courses/:id", authMiddleware, GetCourseById);
router.post("/courses", authMiddleware, CreateCourse);
router.put("/courses/:id", authMiddleware, UpdateCourse);
router.put("/courses/:id/submit-review", authMiddleware, SubmitCourseForReview);
router.put("/courses/:id/publish", authMiddleware, adminOnly, PublishCourse);
router.put("/courses/:id/reject", authMiddleware, adminOnly, RejectCourse);
router.delete("/courses/:id", authMiddleware, adminOnly, DeleteCourse);

export default router;
