"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeSubmission = exports.getAssignmentSubmissions = exports.deleteAssignment = exports.updateAssignment = exports.getAssignmentById = exports.getCourseAssignments = exports.createAssignment = void 0;
const Errors_1 = require("../../../errors/Errors");
const assignmentsService = __importStar(require("./assignments.service"));
const assignments_validation_1 = require("./assignments.validation");
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
/** The staff member behind the request; role decides Admin vs Tutor reach. */
const caller = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return { id: req.user.id, role: req.user.role };
};
const createAssignment = async (req, res) => {
    const input = parse(assignments_validation_1.createAssignmentSchema, req.body);
    const data = await assignmentsService.createAssignmentService(caller(req), input);
    return res.status(201).json({ success: true, data });
};
exports.createAssignment = createAssignment;
const getCourseAssignments = async (req, res) => {
    const { courseId } = parse(assignments_validation_1.courseIdParamSchema, req.params);
    const data = await assignmentsService.getCourseAssignmentsService(caller(req), courseId);
    return res.json({ success: true, data });
};
exports.getCourseAssignments = getCourseAssignments;
const getAssignmentById = async (req, res) => {
    const { id } = parse(assignments_validation_1.assignmentIdParamSchema, req.params);
    const data = await assignmentsService.getAssignmentByIdService(caller(req), id);
    return res.json({ success: true, data });
};
exports.getAssignmentById = getAssignmentById;
const updateAssignment = async (req, res) => {
    const { id } = parse(assignments_validation_1.assignmentIdParamSchema, req.params);
    const input = parse(assignments_validation_1.updateAssignmentSchema, req.body);
    const data = await assignmentsService.updateAssignmentService(caller(req), id, input);
    return res.json({ success: true, data });
};
exports.updateAssignment = updateAssignment;
const deleteAssignment = async (req, res) => {
    const { id } = parse(assignments_validation_1.assignmentIdParamSchema, req.params);
    const data = await assignmentsService.deleteAssignmentService(caller(req), id);
    // `message` sits alongside `data` here — the original replied with both.
    return res.json({
        success: true,
        message: "Assignment deleted successfully",
        data,
    });
};
exports.deleteAssignment = deleteAssignment;
const getAssignmentSubmissions = async (req, res) => {
    const { assignmentId } = parse(assignments_validation_1.assignmentIdRouteParamSchema, req.params);
    const data = await assignmentsService.getAssignmentSubmissionsService(caller(req), assignmentId);
    return res.json({ success: true, data });
};
exports.getAssignmentSubmissions = getAssignmentSubmissions;
const gradeSubmission = async (req, res) => {
    const { submissionId } = parse(assignments_validation_1.submissionIdParamSchema, req.params);
    const input = parse(assignments_validation_1.gradeSubmissionSchema, req.body);
    const data = await assignmentsService.gradeSubmissionService(caller(req), submissionId, input);
    return res.json({ success: true, data });
};
exports.gradeSubmission = gradeSubmission;
