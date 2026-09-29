"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const enrollments_controller_1 = require("./enrollments.controller");
/** Mounted at /api/student — paths unchanged. */
const router = (0, express_1.Router)();
router.get("/my-enrollments", auth_1.authMiddleware, enrollments_controller_1.listMyEnrollments);
router.post("/enroll", auth_1.authMiddleware, enrollments_controller_1.enrollInCourse);
router.get("/progress/:courseId", auth_1.authMiddleware, enrollments_controller_1.getEnrollmentProgress);
exports.default = router;
