"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const courses_controller_1 = require("./courses.controller");
/**
 * Mounted at /api/admin (not under a /courses prefix) — several of these are
 * siblings of the course paths, so the full paths are declared here.
 *
 * Every literal segment under /courses has to be declared before
 * "/courses/:id", or ":id" captures "my-courses", "pending" and "cleanup".
 */
const router = (0, express_1.Router)();
router.get("/courses", auth_1.authMiddleware, courses_controller_1.GetAllCourses);
router.get("/courses/my-courses", auth_1.authMiddleware, courses_controller_1.GetMyCourses);
router.get("/courses/pending/count", auth_1.authMiddleware, auth_1.adminOnly, courses_controller_1.GetPendingCoursesCount);
router.get("/courses/pending", auth_1.authMiddleware, auth_1.adminOnly, courses_controller_1.GetPendingCourses);
router.post("/courses/cleanup", auth_1.authMiddleware, courses_controller_1.CleanupOrphanedCourses);
router.get("/tutors", auth_1.authMiddleware, auth_1.adminOnly, courses_controller_1.GetAllTutors);
router.put("/admin/tutors/:id/status", auth_1.authMiddleware, auth_1.adminOnly, courses_controller_1.ToggleTutorStatus);
router.get("/courses/:id", auth_1.authMiddleware, courses_controller_1.GetCourseById);
router.post("/courses", auth_1.authMiddleware, courses_controller_1.CreateCourse);
router.put("/courses/:id", auth_1.authMiddleware, courses_controller_1.UpdateCourse);
router.put("/courses/:id/submit-review", auth_1.authMiddleware, courses_controller_1.SubmitCourseForReview);
router.put("/courses/:id/publish", auth_1.authMiddleware, auth_1.adminOnly, courses_controller_1.PublishCourse);
router.put("/courses/:id/reject", auth_1.authMiddleware, auth_1.adminOnly, courses_controller_1.RejectCourse);
router.delete("/courses/:id", auth_1.authMiddleware, auth_1.adminOnly, courses_controller_1.DeleteCourse);
exports.default = router;
