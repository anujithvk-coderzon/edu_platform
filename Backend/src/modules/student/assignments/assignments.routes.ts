import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { upload_assignment } from "../../../lib/multer";
import {
  getSubmission,
  listCourseAssignments,
  submitAssignment,
  uploadAssignmentFile,
} from "./assignments.controller";

/**
 * Mounted at /api/student/assignments — paths unchanged.
 * `/upload` is declared before `/:assignmentId/...` so the literal segment is
 * not captured as an id.
 */
const router = Router();

router.post("/upload", authMiddleware, upload_assignment, uploadAssignmentFile);
router.get("/course/:courseId", authMiddleware, listCourseAssignments);
router.post("/:assignmentId/submit", authMiddleware, submitAssignment);
router.get("/:assignmentId/submission", authMiddleware, getSubmission);

export default router;
