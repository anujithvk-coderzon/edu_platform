import { Router } from "express";
import { authMiddleware, adminOnly } from "../../../middlewares/auth";
import {
  blockStudent,
  deleteUser,
  getAllRegisteredStudents,
  getAllStudents,
  getStudentStats,
  getStudentsCount,
  getUserById,
  getUserStats,
  unblockStudent,
  updateUser,
} from "./students.controller";

/** Mounted at /api/admin/students — paths unchanged. */
const router = Router();

// Literal paths first: declared after "/:id" they were swallowed by it, which
// made both /stats endpoints unreachable (":id" matched the string "stats").
router.get("/count", authMiddleware, adminOnly, getStudentsCount);
router.get("/registered", authMiddleware, adminOnly, getAllRegisteredStudents);
router.get("/stats/overview", authMiddleware, adminOnly, getUserStats);
router.get("/stats/detailed", authMiddleware, adminOnly, getStudentStats);

router.get("/", authMiddleware, adminOnly, getAllStudents);

// Parameterised paths last. "/:studentId/block" is two segments so it cannot
// collide with "/:id", but it stays grouped with the other params.
router.get("/:id", authMiddleware, adminOnly, getUserById);
router.put("/:studentId/block", authMiddleware, adminOnly, blockStudent);
router.put("/:studentId/unblock", authMiddleware, adminOnly, unblockStudent);
router.put("/:id", authMiddleware, adminOnly, updateUser);
router.delete("/:id", authMiddleware, adminOnly, deleteUser);

export default router;
