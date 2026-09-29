"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupOrphanedCourses = exports.DeleteCourse = exports.GetPendingCourses = exports.GetPendingCoursesCount = exports.RejectCourse = exports.PublishCourse = exports.SubmitCourseForReview = exports.UpdateCourse = exports.CreateCourse = exports.GetCourseById = exports.ToggleTutorStatus = exports.GetAllTutors = exports.GetMyCourses = exports.GetAllCourses = void 0;
const Errors_1 = require("../../../errors/Errors");
const courses_service_1 = require("./courses.service");
const courses_validation_1 = require("./courses.validation");
/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 *
 * `req.user.role` is the admin role ("Admin" or "Tutor") and every service
 * branches on it, so it is always passed through untouched.
 */
const callerId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
const GetAllCourses = async (req, res) => {
    const parsed = courses_validation_1.allCoursesQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, courses_service_1.listAllCoursesService)(parsed.data);
    return res.json({ success: true, data });
};
exports.GetAllCourses = GetAllCourses;
const GetMyCourses = async (req, res) => {
    const parsed = courses_validation_1.myCoursesQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, courses_service_1.listMyCoursesService)(parsed.data, callerId(req), req.user?.role);
    return res.json({ success: true, data });
};
exports.GetMyCourses = GetMyCourses;
const GetAllTutors = async (req, res) => {
    const parsed = courses_validation_1.tutorsQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw parsed.error;
    callerId(req);
    const data = await (0, courses_service_1.listTutorsService)(parsed.data, req.user?.type, req.user?.role);
    return res.json({ success: true, data });
};
exports.GetAllTutors = GetAllTutors;
const ToggleTutorStatus = async (req, res) => {
    const parsed = courses_validation_1.toggleTutorStatusSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    callerId(req);
    const { tutor, message } = await (0, courses_service_1.toggleTutorStatusService)(req.params.id, parsed.data, req.user?.type, req.user?.role);
    return res.json({ success: true, data: { tutor }, message });
};
exports.ToggleTutorStatus = ToggleTutorStatus;
const GetCourseById = async (req, res) => {
    const data = await (0, courses_service_1.getCourseByIdService)(req.params.id, callerId(req), req.user?.role);
    return res.json({ success: true, data });
};
exports.GetCourseById = GetCourseById;
const CreateCourse = async (req, res) => {
    const parsed = courses_validation_1.createCourseSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, courses_service_1.createCourseService)(parsed.data, {
        id: callerId(req),
        firstName: req.user.firstName,
        lastName: req.user.lastName,
    });
    return res.status(201).json({ success: true, data });
};
exports.CreateCourse = CreateCourse;
const UpdateCourse = async (req, res) => {
    const parsed = courses_validation_1.updateCourseSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, courses_service_1.updateCourseService)(req.params.id, parsed.data, callerId(req), req.user?.role);
    return res.json({ success: true, data });
};
exports.UpdateCourse = UpdateCourse;
const SubmitCourseForReview = async (req, res) => {
    // The original nested `message` inside `data` on this route — kept as-is.
    const data = await (0, courses_service_1.submitCourseForReviewService)(req.params.id, callerId(req));
    return res.json({ success: true, data });
};
exports.SubmitCourseForReview = SubmitCourseForReview;
const PublishCourse = async (req, res) => {
    callerId(req);
    const data = await (0, courses_service_1.publishCourseService)(req.params.id, req.user?.role);
    return res.json({ success: true, data });
};
exports.PublishCourse = PublishCourse;
const RejectCourse = async (req, res) => {
    const parsed = courses_validation_1.rejectCourseSchema.safeParse(req.body ?? {});
    if (!parsed.success)
        throw parsed.error;
    callerId(req);
    const data = await (0, courses_service_1.rejectCourseService)(req.params.id, parsed.data, req.user?.role);
    return res.json({ success: true, data });
};
exports.RejectCourse = RejectCourse;
const GetPendingCoursesCount = async (req, res) => {
    callerId(req);
    const data = await (0, courses_service_1.getPendingCoursesCountService)(req.user?.role);
    return res.json({ success: true, data });
};
exports.GetPendingCoursesCount = GetPendingCoursesCount;
const GetPendingCourses = async (req, res) => {
    callerId(req);
    const data = await (0, courses_service_1.listPendingCoursesService)(req.user?.role);
    return res.json({ success: true, data });
};
exports.GetPendingCourses = GetPendingCourses;
const DeleteCourse = async (req, res) => {
    const summary = await (0, courses_service_1.deleteCourseService)(req.params.id, callerId(req), req.user?.role);
    // The original response carried `summary` at the top level, not under
    // `data` — kept as-is.
    return res.json({
        success: true,
        message: "Course and all associated files deleted successfully",
        summary,
    });
};
exports.DeleteCourse = DeleteCourse;
const CleanupOrphanedCourses = async (req, res) => {
    callerId(req);
    const { data, message } = await (0, courses_service_1.cleanupOrphanedCoursesService)();
    return res.json({ success: true, data, message });
};
exports.CleanupOrphanedCourses = CleanupOrphanedCourses;
