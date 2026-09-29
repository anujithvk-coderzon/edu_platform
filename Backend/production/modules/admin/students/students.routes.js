"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const students_controller_1 = require("./students.controller");
/** Mounted at /api/admin/students — paths unchanged. */
const router = (0, express_1.Router)();
// Literal paths first: declared after "/:id" they were swallowed by it, which
// made both /stats endpoints unreachable (":id" matched the string "stats").
router.get("/count", auth_1.authMiddleware, auth_1.adminOnly, students_controller_1.getStudentsCount);
router.get("/registered", auth_1.authMiddleware, auth_1.adminOnly, students_controller_1.getAllRegisteredStudents);
router.get("/stats/overview", auth_1.authMiddleware, auth_1.adminOnly, students_controller_1.getUserStats);
router.get("/stats/detailed", auth_1.authMiddleware, auth_1.adminOnly, students_controller_1.getStudentStats);
router.get("/", auth_1.authMiddleware, auth_1.adminOnly, students_controller_1.getAllStudents);
// Parameterised paths last. "/:studentId/block" is two segments so it cannot
// collide with "/:id", but it stays grouped with the other params.
router.get("/:id", auth_1.authMiddleware, auth_1.adminOnly, students_controller_1.getUserById);
router.put("/:studentId/block", auth_1.authMiddleware, auth_1.adminOnly, students_controller_1.blockStudent);
router.put("/:studentId/unblock", auth_1.authMiddleware, auth_1.adminOnly, students_controller_1.unblockStudent);
router.put("/:id", auth_1.authMiddleware, auth_1.adminOnly, students_controller_1.updateUser);
router.delete("/:id", auth_1.authMiddleware, auth_1.adminOnly, students_controller_1.deleteUser);
exports.default = router;
