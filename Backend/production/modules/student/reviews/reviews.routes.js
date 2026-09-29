"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const reviews_controller_1 = require("./reviews.controller");
/** Mounted at /api/student/reviews — paths unchanged. */
const router = (0, express_1.Router)();
router.post("/", auth_1.authMiddleware, reviews_controller_1.submitReview);
router.get("/course/:courseId", reviews_controller_1.listCourseReviews);
router.get("/my-review/:courseId", auth_1.authMiddleware, reviews_controller_1.getMyReview);
exports.default = router;
