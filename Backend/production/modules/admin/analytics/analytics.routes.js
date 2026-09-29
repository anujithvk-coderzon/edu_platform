"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const analytics_controller_1 = require("./analytics.controller");
/** Mounted at /api/admin/analytics — paths unchanged. */
const router = (0, express_1.Router)();
router.get("/tutor", auth_1.authMiddleware, analytics_controller_1.getTutorAnalytics);
router.get("/course/:courseId/completion", auth_1.authMiddleware, analytics_controller_1.getCourseCompletion);
exports.default = router;
