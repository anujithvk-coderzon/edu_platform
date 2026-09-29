"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const enrollments_controller_1 = require("./enrollments.controller");
/** Mounted at /api/admin/enrollments — paths unchanged. */
const router = (0, express_1.Router)();
// Literal prefixes first, so "/enroll" and friends are not matched as an
// ":enrollmentId".
router.post("/enroll", auth_1.authMiddleware, enrollments_controller_1.enrollInCourse);
router.get("/my-enrollments", auth_1.authMiddleware, enrollments_controller_1.getMyEnrollments);
router.get("/course/:courseId/students", auth_1.authMiddleware, enrollments_controller_1.getCourseStudents);
router.get("/progress/:courseId", auth_1.authMiddleware, enrollments_controller_1.getEnrollmentProgress);
router.put("/:enrollmentId/status", auth_1.authMiddleware, enrollments_controller_1.updateEnrollmentStatus);
router.delete("/:enrollmentId", auth_1.authMiddleware, enrollments_controller_1.deleteEnrollment);
exports.default = router;
