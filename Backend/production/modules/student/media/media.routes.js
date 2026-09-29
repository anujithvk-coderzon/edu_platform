"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_controller_1 = require("./media.controller");
/** Mounted at /api/student/proxy — paths unchanged. */
const router = (0, express_1.Router)();
router.options("/pdf", media_controller_1.pdfPreflight);
router.get("/pdf", media_controller_1.proxyPdf);
exports.default = router;
