"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReorderModule = exports.DeleteModule = exports.UpdateModule = exports.CreateModule = exports.GetModuleById = exports.GetCourseModules = void 0;
const Errors_1 = require("../../../errors/Errors");
const modules_service_1 = require("./modules.service");
const modules_validation_1 = require("./modules.validation");
/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
const callerId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
const GetCourseModules = async (req, res) => {
    const data = await (0, modules_service_1.getCourseModulesService)(req.params.courseId, callerId(req), req.user?.role);
    return res.json({ success: true, data });
};
exports.GetCourseModules = GetCourseModules;
const GetModuleById = async (req, res) => {
    const data = await (0, modules_service_1.getModuleByIdService)(req.params.id, callerId(req), req.user?.role);
    return res.json({ success: true, data });
};
exports.GetModuleById = GetModuleById;
const CreateModule = async (req, res) => {
    const parsed = modules_validation_1.createModuleSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, modules_service_1.createModuleService)(parsed.data, callerId(req), req.user?.role);
    return res.status(201).json({ success: true, data });
};
exports.CreateModule = CreateModule;
const UpdateModule = async (req, res) => {
    const parsed = modules_validation_1.updateModuleSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, modules_service_1.updateModuleService)(req.params.id, parsed.data, callerId(req), req.user?.role);
    return res.json({ success: true, data });
};
exports.UpdateModule = UpdateModule;
const DeleteModule = async (req, res) => {
    await (0, modules_service_1.deleteModuleService)(req.params.id, callerId(req), req.user?.role);
    // The original response carried no `data` key — kept as-is.
    return res.json({
        success: true,
        message: "Module deleted successfully",
    });
};
exports.DeleteModule = DeleteModule;
const ReorderModule = async (req, res) => {
    const parsed = modules_validation_1.reorderModuleSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, modules_service_1.reorderModuleService)(req.params.id, parsed.data, callerId(req), req.user?.role);
    return res.json({ success: true, data });
};
exports.ReorderModule = ReorderModule;
