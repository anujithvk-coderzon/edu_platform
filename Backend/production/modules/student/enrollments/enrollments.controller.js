"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnrollmentProgress = exports.enrollInCourse = exports.listMyEnrollments = void 0;
const Errors_1 = require("../../../errors/Errors");
const enrollments_service_1 = require("./enrollments.service");
const enrollments_validation_1 = require("./enrollments.validation");
/** authMiddleware guarantees req.user on every route in this module. */
const studentId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
const listMyEnrollments = async (req, res) => {
    const parsed = enrollments_validation_1.enrollmentQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, enrollments_service_1.listMyEnrollmentsService)(studentId(req), parsed.data);
    return res.json({ success: true, data });
};
exports.listMyEnrollments = listMyEnrollments;
const enrollInCourse = async (req, res) => {
    const parsed = enrollments_validation_1.enrollSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, enrollments_service_1.enrollInCourseService)(studentId(req), parsed.data.courseId);
    return res.status(201).json({
        success: true,
        data,
        message: "Successfully enrolled in course",
    });
};
exports.enrollInCourse = enrollInCourse;
const getEnrollmentProgress = async (req, res) => {
    const data = await (0, enrollments_service_1.getEnrollmentProgressService)(studentId(req), req.params.courseId);
    return res.json({ success: true, data });
};
exports.getEnrollmentProgress = getEnrollmentProgress;
