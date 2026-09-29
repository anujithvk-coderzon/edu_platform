import { Router } from "express";
import { authMiddleware, adminOnly } from "../../../middlewares/auth";
import {
  CreateModule,
  DeleteModule,
  GetCourseModules,
  GetModuleById,
  ReorderModule,
  UpdateModule,
} from "./modules.controller";

/** Mounted at /api/admin/modules — paths unchanged. */
const router = Router();

// The literal segment has to be declared first, or ":id" swallows "course".
router.get("/course/:courseId", authMiddleware, GetCourseModules);
router.get("/:id", authMiddleware, GetModuleById);

router.post("/", authMiddleware, adminOnly, CreateModule);
router.put("/:id", authMiddleware, adminOnly, UpdateModule);
router.delete("/:id", authMiddleware, adminOnly, DeleteModule);
router.put("/:id/reorder", authMiddleware, adminOnly, ReorderModule);

export default router;
