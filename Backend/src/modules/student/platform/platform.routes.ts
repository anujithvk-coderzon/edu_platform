import { Router } from "express";
import { getPlatformStats } from "./platform.controller";

/** Mounted at /api/student/platform — paths unchanged. */
const router = Router();

router.get("/stats", getPlatformStats);

export default router;
