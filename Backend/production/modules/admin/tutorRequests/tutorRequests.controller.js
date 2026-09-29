"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectTutorRequest = exports.acceptTutorRequest = exports.getAllTutorRequests = exports.getPendingTutorRequestsCount = void 0;
const Errors_1 = require("../../../errors/Errors");
const tutorRequests_service_1 = require("./tutorRequests.service");
const tutorRequests_validation_1 = require("./tutorRequests.validation");
/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
const adminId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
const getPendingTutorRequestsCount = async (req, res) => {
    adminId(req);
    const data = await (0, tutorRequests_service_1.getPendingTutorRequestsCountService)(req.user?.role);
    return res.json({ success: true, data });
};
exports.getPendingTutorRequestsCount = getPendingTutorRequestsCount;
const getAllTutorRequests = async (req, res) => {
    adminId(req);
    const parsed = tutorRequests_validation_1.tutorRequestQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, tutorRequests_service_1.getAllTutorRequestsService)(req.user?.role, parsed.data);
    return res.json({ success: true, data });
};
exports.getAllTutorRequests = getAllTutorRequests;
const acceptTutorRequest = async (req, res) => {
    adminId(req);
    const parsed = tutorRequests_validation_1.requestIdParamSchema.safeParse(req.params);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, tutorRequests_service_1.acceptTutorRequestService)(req.user?.role, parsed.data.requestId);
    return res.json({
        success: true,
        data,
        message: "Tutor request accepted successfully. Welcome email has been sent.",
    });
};
exports.acceptTutorRequest = acceptTutorRequest;
const rejectTutorRequest = async (req, res) => {
    adminId(req);
    const parsed = tutorRequests_validation_1.requestIdParamSchema.safeParse(req.params);
    if (!parsed.success)
        throw parsed.error;
    await (0, tutorRequests_service_1.rejectTutorRequestService)(req.user?.role, parsed.data.requestId);
    return res.json({
        success: true,
        message: "Tutor request rejected successfully. Rejection email has been sent.",
    });
};
exports.rejectTutorRequest = rejectTutorRequest;
