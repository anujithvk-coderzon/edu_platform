import { Router } from "express";
import {
  getCourseById,
  listCategories,
  listCourses,
} from "./courses.controller";

/**
 * Mounted at /api/student — paths unchanged from the previous inline routes.
 * `/courses/categories/all` must stay ahead of `/courses/:id`, or the literal
 * segment would be captured as an id.
 */
const router = Router();

router.get("/courses", listCourses);
router.get("/courses/categories/all", listCategories);
router.get("/courses/:id", getCourseById);

export default router;
