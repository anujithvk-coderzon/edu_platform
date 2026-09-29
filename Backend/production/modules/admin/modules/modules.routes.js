"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const modules_controller_1 = require("./modules.controller");
/** Mounted at /api/admin/modules — paths unchanged. */
const router = (0, express_1.Router)();
// The literal segment has to be declared first, or ":id" swallows "course".
router.get("/course/:courseId", auth_1.authMiddleware, modules_controller_1.GetCourseModules);
router.get("/:id", auth_1.authMiddleware, modules_controller_1.GetModuleById);
router.post("/", auth_1.authMiddleware, auth_1.adminOnly, modules_controller_1.CreateModule);
router.put("/:id", auth_1.authMiddleware, auth_1.adminOnly, modules_controller_1.UpdateModule);
router.delete("/:id", auth_1.authMiddleware, auth_1.adminOnly, modules_controller_1.DeleteModule);
router.put("/:id/reorder", auth_1.authMiddleware, auth_1.adminOnly, modules_controller_1.ReorderModule);
exports.default = router;
