"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const materials_controller_1 = require("./materials.controller");
/** Mounted at /api/student/materials — paths unchanged. */
const router = (0, express_1.Router)();
router.get("/:id", auth_1.authMiddleware, materials_controller_1.getMaterialById);
router.post("/:id/complete", auth_1.authMiddleware, materials_controller_1.completeMaterial);
exports.default = router;
