import { Router } from "express";
import { authMiddleware, adminOnly } from "../../../middlewares/auth";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "./categories.controller";

/** Mounted at /api/admin/categories — paths unchanged. */
const router = Router();

// Reads are public — the catalogue uses them before login.
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Writes are admin-only.
router.post("/", authMiddleware, adminOnly, createCategory);
router.put("/:id", authMiddleware, adminOnly, updateCategory);
router.delete("/:id", authMiddleware, adminOnly, deleteCategory);

export default router;
