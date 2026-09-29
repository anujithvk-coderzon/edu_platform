"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const analytics_routes_1 = __importDefault(require("./analytics/analytics.routes"));
const assignments_routes_1 = __importDefault(require("./assignments/assignments.routes"));
const categories_routes_1 = __importDefault(require("./categories/categories.routes"));
const enrollments_routes_1 = __importDefault(require("./enrollments/enrollments.routes"));
const materials_routes_1 = __importDefault(require("./materials/materials.routes"));
const modules_routes_1 = __importDefault(require("./modules/modules.routes"));
const students_routes_1 = __importDefault(require("./students/students.routes"));
const tutorRequests_routes_1 = __importDefault(require("./tutorRequests/tutorRequests.routes"));
const uploads_routes_1 = __importDefault(require("./uploads/uploads.routes"));
const courses_routes_1 = __importDefault(require("./courses/courses.routes"));
/**
 * Every admin-facing module, mounted at /api/admin.
 * Paths are unchanged from the previous flat route file.
 */
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/analytics", analytics_routes_1.default);
router.use("/assignments", assignments_routes_1.default);
router.use("/categories", categories_routes_1.default);
router.use("/enrollments", enrollments_routes_1.default);
router.use("/materials", materials_routes_1.default);
router.use("/modules", modules_routes_1.default);
router.use("/students", students_routes_1.default);
router.use("/tutor-requests", tutorRequests_routes_1.default);
router.use("/uploads", uploads_routes_1.default);
// Courses declares full paths of its own (/courses, /tutors,
// /admin/tutors/:id/status), so it mounts at the root — last, so the
// prefixed routers above always win.
router.use("/", courses_routes_1.default);
exports.default = router;
