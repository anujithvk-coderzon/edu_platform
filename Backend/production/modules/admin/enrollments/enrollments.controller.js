"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEnrollment = exports.getEnrollmentProgress = exports.updateEnrollmentStatus = exports.getCourseStudents = exports.getMyEnrollments = exports.enrollInCourse = void 0;
const Errors_1 = require("../../../errors/Errors");
const enrollments_service_1 = require("./enrollments.service");
const enrollments_validation_1 = require("./enrollments.validation");
/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
const parse = (schema, value) => {
    const result = schema.safeParse(value);
    if (!result.success)
        throw result.error;
    return result.data;
};
/** authMiddleware guarantees req.user on every route in this module. */
const callerId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
/** "Admin" bypasses course-ownership checks; "Tutor" does not. */
const callerRole = (req) => req.user?.role;
const enrollInCourse = async (req, res) => {
    const { courseId } = parse(enrollments_validation_1.enrollSchema, req.body);
    const data = await (0, enrollments_service_1.enrollInCourseService)(callerId(req), courseId);
    return res.status(201).json({ success: true, data });
};
exports.enrollInCourse = enrollInCourse;
const getMyEnrollments = async (req, res) => {
    const data = await (0, enrollments_service_1.getMyEnrollmentsService)(callerId(req));
    return res.json({ success: true, data });
};
exports.getMyEnrollments = getMyEnrollments;
const getCourseStudents = async (req, res) => {
    const { courseId } = parse(enrollments_validation_1.courseIdParamSchema, req.params);
    const data = await (0, enrollments_service_1.getCourseStudentsService)(callerId(req), callerRole(req), courseId);
    return res.json({ success: true, data });
};
exports.getCourseStudents = getCourseStudents;
const updateEnrollmentStatus = async (req, res) => {
    const { enrollmentId } = parse(enrollments_validation_1.enrollmentIdParamSchema, req.params);
    const { status } = parse(enrollments_validation_1.updateEnrollmentStatusSchema, req.body);
    const data = await (0, enrollments_service_1.updateEnrollmentStatusService)(callerId(req), callerRole(req), enrollmentId, status);
    return res.json({ success: true, data });
};
exports.updateEnrollmentStatus = updateEnrollmentStatus;
const getEnrollmentProgress = async (req, res) => {
    const { courseId } = parse(enrollments_validation_1.courseIdParamSchema, req.params);
    const data = await (0, enrollments_service_1.getEnrollmentProgressService)(callerId(req), courseId);
    return res.json({ success: true, data });
};
exports.getEnrollmentProgress = getEnrollmentProgress;
const deleteEnrollment = async (req, res) => {
    const { enrollmentId } = parse(enrollments_validation_1.enrollmentIdParamSchema, req.params);
    await (0, enrollments_service_1.deleteEnrollmentService)(callerId(req), callerRole(req), enrollmentId);
    return res.json({
        success: true,
        message: "Enrollment cancelled successfully",
    });
};
exports.deleteEnrollment = deleteEnrollment;
