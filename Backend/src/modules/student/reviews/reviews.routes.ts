import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth";
import {
  getMyReview,
  listCourseReviews,
  submitReview,
} from "./reviews.controller";

/** Mounted at /api/student/reviews — paths unchanged. */
const router = Router();

router.post("/", authMiddleware, submitReview);
router.get("/course/:courseId", listCourseReviews);
router.get("/my-review/:courseId", authMiddleware, getMyReview);

export default router;
