"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const assignments_controller_1 = require("./assignments.controller");
/** Mounted at /api/admin/assignments — paths unchanged. */
const router = (0, express_1.Router)();
// Declared before "/:id" so "course" and "submissions" are never read as an
// assignment id.
router.get("/course/:courseId", auth_1.authMiddleware, assignments_controller_1.getCourseAssignments);
router.put("/submissions/:submissionId/grade", auth_1.authMiddleware, auth_1.adminOnly, assignments_controller_1.gradeSubmission);
// Reading the assignment set — any authenticated staff member; the service
// narrows a Tutor to their own work.
router.get("/:id", auth_1.authMiddleware, assignments_controller_1.getAssignmentById);
router.get("/:assignmentId/submissions", auth_1.authMiddleware, assignments_controller_1.getAssignmentSubmissions);
// Writing to the assignment set is staff-only.
router.post("/", auth_1.authMiddleware, auth_1.adminOnly, assignments_controller_1.createAssignment);
router.put("/:id", auth_1.authMiddleware, auth_1.adminOnly, assignments_controller_1.updateAssignment);
router.delete("/:id", auth_1.authMiddleware, auth_1.adminOnly, assignments_controller_1.deleteAssignment);
exports.default = router;
