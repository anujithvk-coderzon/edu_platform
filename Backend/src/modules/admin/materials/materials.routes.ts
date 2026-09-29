import { Router } from "express";
import { authMiddleware, adminOnly } from "../../../middlewares/auth";
import {
  completeMaterial,
  createMaterial,
  deleteMaterial,
  getCourseMaterials,
  getMaterialById,
  updateMaterial,
} from "./materials.controller";

/** Mounted at /api/admin/materials — paths unchanged. */
const router = Router();

// Declared before "/:id" so "course" is never read as a material id.
router.get("/course/:courseId", authMiddleware, getCourseMaterials);
router.get("/:id", authMiddleware, getMaterialById);

// Writing to the catalogue is staff-only.
router.post("/", authMiddleware, adminOnly, createMaterial);
router.put("/:id", authMiddleware, adminOnly, updateMaterial);
router.delete("/:id", authMiddleware, adminOnly, deleteMaterial);

// Progress tracking — any authenticated user enrolled in the course.
router.post("/:id/complete", authMiddleware, completeMaterial);

export default router;
