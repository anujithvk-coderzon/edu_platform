"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const categories_controller_1 = require("./categories.controller");
/** Mounted at /api/admin/categories — paths unchanged. */
const router = (0, express_1.Router)();
// Reads are public — the catalogue uses them before login.
router.get("/", categories_controller_1.getAllCategories);
router.get("/:id", categories_controller_1.getCategoryById);
// Writes are admin-only.
router.post("/", auth_1.authMiddleware, auth_1.adminOnly, categories_controller_1.createCategory);
router.put("/:id", auth_1.authMiddleware, auth_1.adminOnly, categories_controller_1.updateCategory);
router.delete("/:id", auth_1.authMiddleware, auth_1.adminOnly, categories_controller_1.deleteCategory);
exports.default = router;
