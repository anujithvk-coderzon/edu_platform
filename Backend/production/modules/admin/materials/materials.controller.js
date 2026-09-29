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
exports.completeMaterial = exports.deleteMaterial = exports.updateMaterial = exports.createMaterial = exports.getMaterialById = exports.getCourseMaterials = void 0;
const Errors_1 = require("../../../errors/Errors");
const materialsService = __importStar(require("./materials.service"));
const materials_validation_1 = require("./materials.validation");
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
const getCourseMaterials = async (req, res) => {
    caller(req); // authenticated staff only
    const { courseId } = parse(materials_validation_1.courseIdParamSchema, req.params);
    const data = await materialsService.getCourseMaterialsService(courseId);
    return res.json({ success: true, data });
};
exports.getCourseMaterials = getCourseMaterials;
const getMaterialById = async (req, res) => {
    const { id } = parse(materials_validation_1.materialIdParamSchema, req.params);
    const data = await materialsService.getMaterialByIdService(caller(req).id, id);
    return res.json({ success: true, data });
};
exports.getMaterialById = getMaterialById;
const createMaterial = async (req, res) => {
    const input = parse(materials_validation_1.createMaterialSchema, req.body);
    const data = await materialsService.createMaterialService(caller(req), input);
    return res.status(201).json({ success: true, data });
};
exports.createMaterial = createMaterial;
const updateMaterial = async (req, res) => {
    const { id } = parse(materials_validation_1.materialIdParamSchema, req.params);
    const input = parse(materials_validation_1.updateMaterialSchema, req.body);
    const data = await materialsService.updateMaterialService(caller(req), id, input);
    return res.json({ success: true, data });
};
exports.updateMaterial = updateMaterial;
const deleteMaterial = async (req, res) => {
    const { id } = parse(materials_validation_1.materialIdParamSchema, req.params);
    await materialsService.deleteMaterialService(caller(req), id);
    // No `data` block here — the original replied with a bare message.
    return res.json({
        success: true,
        message: "Material and associated file deleted successfully",
    });
};
exports.deleteMaterial = deleteMaterial;
const completeMaterial = async (req, res) => {
    const { id } = parse(materials_validation_1.materialIdParamSchema, req.params);
    const data = await materialsService.completeMaterialService(caller(req).id, id);
    return res.json({ success: true, data });
};
exports.completeMaterial = completeMaterial;
