import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import analyticsRoutes from "./analytics/analytics.routes";
import assignmentRoutes from "./assignments/assignments.routes";
import categoryRoutes from "./categories/categories.routes";
import enrollmentRoutes from "./enrollments/enrollments.routes";
import materialRoutes from "./materials/materials.routes";
import moduleRoutes from "./modules/modules.routes";
import studentRoutes from "./students/students.routes";
import tutorRequestRoutes from "./tutorRequests/tutorRequests.routes";
import uploadRoutes from "./uploads/uploads.routes";
import courseRoutes from "./courses/courses.routes";

/**
 * Every admin-facing module, mounted at /api/admin.
 * Paths are unchanged from the previous flat route file.
 */
const router = Router();

router.use("/auth", authRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/categories", categoryRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/materials", materialRoutes);
router.use("/modules", moduleRoutes);
router.use("/students", studentRoutes);
router.use("/tutor-requests", tutorRequestRoutes);
router.use("/uploads", uploadRoutes);

// Courses declares full paths of its own (/courses, /tutors,
// /admin/tutors/:id/status), so it mounts at the root — last, so the
// prefixed routers above always win.
router.use("/", courseRoutes);

export default router;
