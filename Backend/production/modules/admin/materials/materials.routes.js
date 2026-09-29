"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const materials_controller_1 = require("./materials.controller");
/** Mounted at /api/admin/materials — paths unchanged. */
const router = (0, express_1.Router)();
// Declared before "/:id" so "course" is never read as a material id.
router.get("/course/:courseId", auth_1.authMiddleware, materials_controller_1.getCourseMaterials);
router.get("/:id", auth_1.authMiddleware, materials_controller_1.getMaterialById);
// Writing to the catalogue is staff-only.
router.post("/", auth_1.authMiddleware, auth_1.adminOnly, materials_controller_1.createMaterial);
router.put("/:id", auth_1.authMiddleware, auth_1.adminOnly, materials_controller_1.updateMaterial);
router.delete("/:id", auth_1.authMiddleware, auth_1.adminOnly, materials_controller_1.deleteMaterial);
// Progress tracking — any authenticated user enrolled in the course.
router.post("/:id/complete", auth_1.authMiddleware, materials_controller_1.completeMaterial);
exports.default = router;
