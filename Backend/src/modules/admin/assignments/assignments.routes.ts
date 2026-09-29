import { Router } from "express";
import { authMiddleware, adminOnly } from "../../../middlewares/auth";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignmentSubmissions,
  getCourseAssignments,
  gradeSubmission,
  updateAssignment,
} from "./assignments.controller";

/** Mounted at /api/admin/assignments — paths unchanged. */
const router = Router();

// Declared before "/:id" so "course" and "submissions" are never read as an
// assignment id.
router.get("/course/:courseId", authMiddleware, getCourseAssignments);
router.put(
  "/submissions/:submissionId/grade",
  authMiddleware,
  adminOnly,
  gradeSubmission,
);

// Reading the assignment set — any authenticated staff member; the service
// narrows a Tutor to their own work.
router.get("/:id", authMiddleware, getAssignmentById);
router.get("/:assignmentId/submissions", authMiddleware, getAssignmentSubmissions);

// Writing to the assignment set is staff-only.
router.post("/", authMiddleware, adminOnly, createAssignment);
router.put("/:id", authMiddleware, adminOnly, updateAssignment);
router.delete("/:id", authMiddleware, adminOnly, deleteAssignment);

export default router;
