import { Router } from "express";
import { pdfPreflight, proxyPdf } from "./media.controller";

/** Mounted at /api/student/proxy — paths unchanged. */
const router = Router();

router.options("/pdf", pdfPreflight);
router.get("/pdf", proxyPdf);

export default router;
