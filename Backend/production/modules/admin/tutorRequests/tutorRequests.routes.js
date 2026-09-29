"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middlewares/auth");
const tutorRequests_controller_1 = require("./tutorRequests.controller");
/** Mounted at /api/admin/tutor-requests — paths unchanged. */
const router = (0, express_1.Router)();
// `/count` is declared first so it is not swallowed by a `/:param` route.
router.get("/count", auth_1.authMiddleware, auth_1.adminOnly, tutorRequests_controller_1.getPendingTutorRequestsCount);
router.get("/", auth_1.authMiddleware, auth_1.adminOnly, tutorRequests_controller_1.getAllTutorRequests);
router.post("/:requestId/accept", auth_1.authMiddleware, auth_1.adminOnly, tutorRequests_controller_1.acceptTutorRequest);
router.post("/:requestId/reject", auth_1.authMiddleware, auth_1.adminOnly, tutorRequests_controller_1.rejectTutorRequest);
exports.default = router;
