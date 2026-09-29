"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAssignmentFile = exports.getSubmission = exports.submitAssignment = exports.listCourseAssignments = void 0;
const Errors_1 = require("../../../errors/Errors");
const assignments_service_1 = require("./assignments.service");
const assignments_validation_1 = require("./assignments.validation");
const studentId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
const listCourseAssignments = async (req, res) => {
    const data = await (0, assignments_service_1.listCourseAssignmentsService)(studentId(req), req.params.courseId);
    return res.json({ success: true, data });
};
exports.listCourseAssignments = listCourseAssignments;
const submitAssignment = async (req, res) => {
    const parsed = assignments_validation_1.submitAssignmentSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, assignments_service_1.submitAssignmentService)(studentId(req), req.params.assignmentId, parsed.data);
    return res.status(201).json({ success: true, data });
};
exports.submitAssignment = submitAssignment;
const getSubmission = async (req, res) => {
    const data = await (0, assignments_service_1.getSubmissionService)(studentId(req), req.params.assignmentId);
    return res.json({ success: true, data });
};
exports.getSubmission = getSubmission;
const uploadAssignmentFile = async (req, res) => {
    studentId(req); // authorisation only; the file is not tied to a course yet
    if (!req.file) {
        throw new Errors_1.BadRequestError("No assignment file uploaded");
    }
    const data = await (0, assignments_service_1.uploadAssignmentFileService)(req.file);
    return res.json({ success: true, data });
};
exports.uploadAssignmentFile = uploadAssignmentFile;
