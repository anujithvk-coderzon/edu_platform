"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategoryService = exports.updateCategoryService = exports.createCategoryService = exports.getCategoryByIdService = exports.listCategoriesService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
/** Every Prisma call and rule for admin category management lives here. */
const listCategoriesService = async () => {
    const categories = await prisma_1.default.category.findMany({
        include: {
            _count: {
                select: { courses: true },
            },
        },
        orderBy: { name: "asc" },
    });
    return { categories };
};
exports.listCategoriesService = listCategoriesService;
const getCategoryByIdService = async (id) => {
    const category = await prisma_1.default.category.findUnique({
        where: { id },
        include: {
            courses: {
                include: {
                    creator: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: { enrollments: true },
                    },
                },
            },
            _count: {
                select: { courses: true },
            },
        },
    });
    if (!category) {
        throw new Errors_1.NotFoundError("Category not found");
    }
    return { category };
};
exports.getCategoryByIdService = getCategoryByIdService;
const createCategoryService = async (input) => {
    // `name` is unique in the schema; the explicit lookup keeps the original
    // 400 + message instead of surfacing a Prisma P2002.
    const existingCategory = await prisma_1.default.category.findUnique({
        where: { name: input.name },
    });
    if (existingCategory) {
        throw new Errors_1.BadRequestError("Category with this name already exists");
    }
    const category = await prisma_1.default.category.create({
        data: { name: input.name, description: input.description },
    });
    return { category };
};
exports.createCategoryService = createCategoryService;
const updateCategoryService = async (id, input) => {
    // Only keys actually sent are written, exactly as the legacy handler did:
    // an empty `name` is ignored, a `description` of "" is not.
    const updates = {};
    if (input.name)
        updates.name = input.name;
    if (input.description !== undefined)
        updates.description = input.description;
    if (input.name) {
        const existingCategory = await prisma_1.default.category.findFirst({
            where: {
                name: input.name,
                NOT: { id },
            },
        });
        if (existingCategory) {
            throw new Errors_1.BadRequestError("Category with this name already exists");
        }
    }
    const existing = await prisma_1.default.category.findUnique({ where: { id } });
    if (!existing) {
        throw new Errors_1.NotFoundError("Category not found");
    }
    const category = await prisma_1.default.category.update({
        where: { id },
        data: updates,
    });
    return { category };
};
exports.updateCategoryService = updateCategoryService;
const deleteCategoryService = async (id) => {
    const category = await prisma_1.default.category.findUnique({
        where: { id },
        include: {
            _count: {
                select: { courses: true },
            },
        },
    });
    if (!category) {
        throw new Errors_1.NotFoundError("Category not found");
    }
    if (category._count.courses > 0) {
        throw new Errors_1.BadRequestError("Cannot delete category with existing courses");
    }
    await prisma_1.default.category.delete({
        where: { id },
    });
};
exports.deleteCategoryService = deleteCategoryService;
