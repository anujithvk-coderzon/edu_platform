"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const courses_controller_1 = require("./courses.controller");
/**
 * Mounted at /api/student — paths unchanged from the previous inline routes.
 * `/courses/categories/all` must stay ahead of `/courses/:id`, or the literal
 * segment would be captured as an id.
 */
const router = (0, express_1.Router)();
router.get("/courses", courses_controller_1.listCourses);
router.get("/courses/categories/all", courses_controller_1.listCategories);
router.get("/courses/:id", courses_controller_1.getCourseById);
exports.default = router;
