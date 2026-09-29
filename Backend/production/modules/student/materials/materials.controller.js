"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeMaterial = exports.getMaterialById = void 0;
const Errors_1 = require("../../../errors/Errors");
const materials_service_1 = require("./materials.service");
const studentId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
const getMaterialById = async (req, res) => {
    const data = await (0, materials_service_1.getMaterialByIdService)(studentId(req), req.params.id);
    return res.json({ success: true, data });
};
exports.getMaterialById = getMaterialById;
const completeMaterial = async (req, res) => {
    const data = await (0, materials_service_1.completeMaterialService)(studentId(req), req.params.id);
    return res.json({ success: true, data });
};
exports.completeMaterial = completeMaterial;
