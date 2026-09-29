"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const courses_routes_1 = __importDefault(require("./courses/courses.routes"));
const enrollments_routes_1 = __importDefault(require("./enrollments/enrollments.routes"));
const materials_routes_1 = __importDefault(require("./materials/materials.routes"));
const reviews_routes_1 = __importDefault(require("./reviews/reviews.routes"));
const assignments_routes_1 = __importDefault(require("./assignments/assignments.routes"));
const uploads_routes_1 = __importDefault(require("./uploads/uploads.routes"));
const platform_routes_1 = __importDefault(require("./platform/platform.routes"));
const media_routes_1 = __importDefault(require("./media/media.routes"));
/**
 * Every student-facing module, mounted at /api/student.
 * Paths are unchanged from the previous flat route file.
 */
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/enrollments", enrollments_routes_1.default);
router.use("/materials", materials_routes_1.default);
router.use("/reviews", reviews_routes_1.default);
router.use("/assignments", assignments_routes_1.default);
router.use("/uploads", uploads_routes_1.default);
router.use("/platform", platform_routes_1.default);
router.use("/proxy", media_routes_1.default);
// Courses own bare paths (/courses, /courses/:id), so they mount at the root.
router.use("/", courses_routes_1.default);
exports.default = router;
