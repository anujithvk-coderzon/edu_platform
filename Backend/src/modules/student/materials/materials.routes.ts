import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { completeMaterial, getMaterialById } from "./materials.controller";

/** Mounted at /api/student/materials — paths unchanged. */
const router = Router();

router.get("/:id", authMiddleware, getMaterialById);
router.post("/:id/complete", authMiddleware, completeMaterial);

export default router;
