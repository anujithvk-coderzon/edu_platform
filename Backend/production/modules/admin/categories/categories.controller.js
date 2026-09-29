"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getAllCategories = void 0;
const Errors_1 = require("../../../errors/Errors");
const categories_service_1 = require("./categories.service");
const categories_validation_1 = require("./categories.validation");
/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */
const adminId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
/** Public: the category list feeds the course catalogue filters. */
const getAllCategories = async (_req, res) => {
    const data = await (0, categories_service_1.listCategoriesService)();
    return res.json({ success: true, data });
};
exports.getAllCategories = getAllCategories;
/** Public: a single category with its courses. */
const getCategoryById = async (req, res) => {
    const data = await (0, categories_service_1.getCategoryByIdService)(req.params.id);
    return res.json({ success: true, data });
};
exports.getCategoryById = getCategoryById;
const createCategory = async (req, res) => {
    adminId(req);
    const parsed = categories_validation_1.createCategorySchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, categories_service_1.createCategoryService)(parsed.data);
    return res.status(201).json({ success: true, data });
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    adminId(req);
    const params = categories_validation_1.categoryIdParamSchema.safeParse(req.params);
    if (!params.success)
        throw params.error;
    const parsed = categories_validation_1.updateCategorySchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, categories_service_1.updateCategoryService)(params.data.id, parsed.data);
    return res.json({ success: true, data });
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    adminId(req);
    await (0, categories_service_1.deleteCategoryService)(req.params.id);
    return res.json({
        success: true,
        message: "Category deleted successfully",
    });
};
exports.deleteCategory = deleteCategory;
