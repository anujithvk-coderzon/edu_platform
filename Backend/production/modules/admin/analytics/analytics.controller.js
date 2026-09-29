"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseCompletion = exports.getTutorAnalytics = void 0;
const Errors_1 = require("../../../errors/Errors");
const analytics_service_1 = require("./analytics.service");
/** authMiddleware guarantees req.user on every route in this module. */
const callerId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
const getTutorAnalytics = async (req, res) => {
    const data = await (0, analytics_service_1.getTutorAnalyticsService)(callerId(req), req.user?.role);
    return res.json({ success: true, data });
};
exports.getTutorAnalytics = getTutorAnalytics;
const getCourseCompletion = async (req, res) => {
    const data = await (0, analytics_service_1.getCourseCompletionService)(callerId(req), req.params.courseId);
    return res.json({ success: true, data });
};
exports.getCourseCompletion = getCourseCompletion;
