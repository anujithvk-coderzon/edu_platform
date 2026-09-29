"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const multer_1 = require("../../../lib/multer");
const assignments_controller_1 = require("./assignments.controller");
/**
 * Mounted at /api/student/assignments — paths unchanged.
 * `/upload` is declared before `/:assignmentId/...` so the literal segment is
 * not captured as an id.
 */
const router = (0, express_1.Router)();
router.post("/upload", auth_1.authMiddleware, multer_1.upload_assignment, assignments_controller_1.uploadAssignmentFile);
router.get("/course/:courseId", auth_1.authMiddleware, assignments_controller_1.listCourseAssignments);
router.post("/:assignmentId/submit", auth_1.authMiddleware, assignments_controller_1.submitAssignment);
router.get("/:assignmentId/submission", auth_1.authMiddleware, assignments_controller_1.getSubmission);
exports.default = router;
