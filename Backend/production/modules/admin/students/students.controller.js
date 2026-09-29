"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.unblockStudent = exports.blockStudent = exports.getUserById = exports.getAllStudents = exports.getStudentStats = exports.getUserStats = exports.getAllRegisteredStudents = exports.getStudentsCount = void 0;
const Errors_1 = require("../../../errors/Errors");
const students_service_1 = require("./students.service");
const students_validation_1 = require("./students.validation");
/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
/** authMiddleware guarantees req.user on every route in this module. */
const adminId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
const getStudentsCount = async (_req, res) => {
    const data = await (0, students_service_1.getStudentsCountService)();
    return res.status(200).json({ success: true, data });
};
exports.getStudentsCount = getStudentsCount;
const getAllRegisteredStudents = async (req, res) => {
    const parsed = students_validation_1.registeredStudentsQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, students_service_1.listRegisteredStudentsService)(parsed.data);
    return res.status(200).json({ success: true, data });
};
exports.getAllRegisteredStudents = getAllRegisteredStudents;
const getUserStats = async (_req, res) => {
    const data = await (0, students_service_1.getUserStatsService)();
    return res.json({ success: true, data });
};
exports.getUserStats = getUserStats;
const getStudentStats = async (_req, res) => {
    const data = await (0, students_service_1.getStudentStatsService)();
    return res.json({ success: true, data });
};
exports.getStudentStats = getStudentStats;
const getAllStudents = async (req, res) => {
    // Validated for parity with the old route chain; the aggregation itself is
    // unpaginated, exactly as before.
    const parsed = students_validation_1.allStudentsQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, students_service_1.getAllStudentsService)(adminId(req), req.user?.role);
    return res.json({ success: true, data });
};
exports.getAllStudents = getAllStudents;
const getUserById = async (req, res) => {
    const parsed = students_validation_1.userIdParamSchema.safeParse(req.params);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, students_service_1.getUserByIdService)(parsed.data.id);
    return res.json({ success: true, data });
};
exports.getUserById = getUserById;
const blockStudent = async (req, res) => {
    const parsed = students_validation_1.studentIdParamSchema.safeParse(req.params);
    if (!parsed.success)
        throw parsed.error;
    const { data, message } = await (0, students_service_1.blockStudentService)(parsed.data.studentId, adminId(req), req.user?.role);
    return res.json({ success: true, data, message });
};
exports.blockStudent = blockStudent;
const unblockStudent = async (req, res) => {
    const parsed = students_validation_1.studentIdParamSchema.safeParse(req.params);
    if (!parsed.success)
        throw parsed.error;
    const { data, message } = await (0, students_service_1.unblockStudentService)(parsed.data.studentId, adminId(req), req.user?.role);
    return res.json({ success: true, data, message });
};
exports.unblockStudent = unblockStudent;
const updateUser = async (req, res) => {
    const params = students_validation_1.userIdParamSchema.safeParse(req.params);
    if (!params.success)
        throw params.error;
    const parsed = students_validation_1.updateUserSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, students_service_1.updateUserService)(params.data.id, parsed.data);
    return res.json({ success: true, data });
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    const parsed = students_validation_1.userIdParamSchema.safeParse(req.params);
    if (!parsed.success)
        throw parsed.error;
    await (0, students_service_1.deleteUserService)(parsed.data.id, adminId(req));
    // No `data` key here — the original response was `{ success, message }`.
    return res.json({ success: true, message: "User deleted successfully" });
};
exports.deleteUser = deleteUser;
