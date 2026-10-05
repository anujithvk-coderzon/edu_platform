import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import courseRoutes from "./courses/courses.routes";
import enrollmentRoutes from "./enrollments/enrollments.routes";
import materialRoutes from "./materials/materials.routes";
import reviewRoutes from "./reviews/reviews.routes";
import assignmentRoutes from "./assignments/assignments.routes";
import uploadRoutes from "./uploads/uploads.routes";
import platformRoutes from "./platform/platform.routes";
import mediaRoutes from "./media/media.routes";
import paymentRoutes from "./payments/payments.routes";
/**
 * Every student-facing module, mounted at /api/student.
 * Paths are unchanged from the previous flat route file.
 */
const router = Router();

router.use("/auth", authRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/materials", materialRoutes);
router.use("/reviews", reviewRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/uploads", uploadRoutes);
router.use("/platform", platformRoutes);
router.use("/proxy", mediaRoutes);

// Courses own bare paths (/courses, /courses/:id), so they mount at the root.
router.use("/", courseRoutes);
router.use("/payments", paymentRoutes);
export default router;
