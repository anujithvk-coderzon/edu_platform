import { Router } from "express";
import { authMiddleware, adminOnly } from "../../../middlewares/auth";
import {
  acceptTutorRequest,
  getAllTutorRequests,
  getPendingTutorRequestsCount,
  rejectTutorRequest,
} from "./tutorRequests.controller";

/** Mounted at /api/admin/tutor-requests — paths unchanged. */
const router = Router();

// `/count` is declared first so it is not swallowed by a `/:param` route.
router.get("/count", authMiddleware, adminOnly, getPendingTutorRequestsCount);
router.get("/", authMiddleware, adminOnly, getAllTutorRequests);

router.post("/:requestId/accept", authMiddleware, adminOnly, acceptTutorRequest);
router.post("/:requestId/reject", authMiddleware, adminOnly, rejectTutorRequest);

export default router;
