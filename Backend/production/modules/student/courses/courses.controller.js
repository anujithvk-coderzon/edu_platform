"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseById = exports.listCategories = exports.listCourses = void 0;
const authToken_1 = require("../../../lib/authToken");
const jwt_1 = require("../../../lib/jwt");
const courses_service_1 = require("./courses.service");
const courses_validation_1 = require("./courses.validation");
/**
 * These endpoints are public but personalise the response when a valid token is
 * present (enrollment status, progress, whether the student has reviewed).
 * An absent or invalid token is not an error — it just means no personalisation.
 */
const optionalStudentId = (req) => {
    const token = (0, authToken_1.getStudentToken)(req);
    if (!token)
        return null;
    return (0, jwt_1.verifyStudentToken)(token)?.id ?? null;
};
const listCourses = async (req, res) => {
    const parsed = courses_validation_1.courseQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, courses_service_1.listCoursesService)(parsed.data, optionalStudentId(req));
    return res.json({ success: true, data });
};
exports.listCourses = listCourses;
const listCategories = async (_req, res) => {
    const data = await (0, courses_service_1.listCategoriesService)();
    return res.json({ success: true, data });
};
exports.listCategories = listCategories;
const getCourseById = async (req, res) => {
    const data = await (0, courses_service_1.getCourseByIdService)(req.params.id, optionalStudentId(req));
    return res.json({ success: true, data });
};
exports.getCourseById = getCourseById;
