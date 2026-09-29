"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderModuleService = exports.deleteModuleService = exports.updateModuleService = exports.createModuleService = exports.getModuleByIdService = exports.getCourseModulesService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const isAdmin = (userRole) => userRole === "Admin";
const getCourseModulesService = async (courseId, userId, userRole) => {
    const course = await prisma_1.default.course.findUnique({
        where: { id: courseId },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    if (course.creatorId !== userId && !isAdmin(userRole)) {
        throw new Errors_1.ForbiddenError("Access denied");
    }
    const modules = await prisma_1.default.courseModule.findMany({
        where: { courseId },
        include: {
            materials: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    orderIndex: true,
                    createdAt: true,
                },
                orderBy: { orderIndex: "asc" },
            },
        },
        orderBy: { orderIndex: "asc" },
    });
    return { modules };
};
exports.getCourseModulesService = getCourseModulesService;
const getModuleByIdService = async (id, userId, userRole) => {
    const module = await prisma_1.default.courseModule.findUnique({
        where: { id },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    creatorId: true,
                },
            },
            materials: {
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { orderIndex: "asc" },
            },
        },
    });
    if (!module) {
        throw new Errors_1.NotFoundError("Module not found");
    }
    if (module.course.creatorId !== userId && !isAdmin(userRole)) {
        throw new Errors_1.ForbiddenError("Access denied");
    }
    return { module };
};
exports.getModuleByIdService = getModuleByIdService;
const createModuleService = async (input, userId, userRole) => {
    const course = await prisma_1.default.course.findUnique({
        where: { id: input.courseId },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    // Access control: Admin can add modules to any course, Tutors can add
    // modules to courses they created or are assigned to
    if (!isAdmin(userRole)) {
        const hasAccess = course.creatorId === userId || course.tutorId === userId;
        if (!hasAccess) {
            throw new Errors_1.ForbiddenError("Not authorized to add modules to this course");
        }
    }
    const module = await prisma_1.default.courseModule.create({
        data: {
            title: input.title,
            description: input.description,
            orderIndex: input.orderIndex,
            courseId: input.courseId,
        },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                },
            },
            materials: true,
        },
    });
    return { module };
};
exports.createModuleService = createModuleService;
const updateModuleService = async (id, input, userId, userRole) => {
    // Only the keys the caller actually sent are written, matching the original
    // handler: a falsy title is ignored, description/orderIndex are applied
    // whenever they are present.
    const updates = {};
    if (input.title)
        updates.title = input.title;
    if (input.description !== undefined)
        updates.description = input.description;
    if (input.orderIndex !== undefined)
        updates.orderIndex = input.orderIndex;
    const existingModule = await prisma_1.default.courseModule.findUnique({
        where: { id },
        include: {
            course: {
                select: {
                    creatorId: true,
                    tutorId: true,
                },
            },
        },
    });
    if (!existingModule) {
        throw new Errors_1.NotFoundError("Module not found");
    }
    // Access control: Admin can update any module, Tutors can update modules in
    // courses they created or are assigned to
    if (!isAdmin(userRole)) {
        const hasAccess = existingModule.course.creatorId === userId ||
            existingModule.course.tutorId === userId;
        if (!hasAccess) {
            throw new Errors_1.ForbiddenError("Not authorized to update this module");
        }
    }
    const module = await prisma_1.default.courseModule.update({
        where: { id },
        data: updates,
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                },
            },
            materials: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    orderIndex: true,
                },
                orderBy: { orderIndex: "asc" },
            },
        },
    });
    return { module };
};
exports.updateModuleService = updateModuleService;
const deleteModuleService = async (id, userId, userRole) => {
    const module = await prisma_1.default.courseModule.findUnique({
        where: { id },
        include: {
            course: {
                select: {
                    creatorId: true,
                    tutorId: true,
                },
            },
            _count: {
                select: { materials: true },
            },
        },
    });
    if (!module) {
        throw new Errors_1.NotFoundError("Module not found");
    }
    // Access control: Admin can delete any module, Tutors can delete modules in
    // courses they created or are assigned to
    if (!isAdmin(userRole)) {
        const hasAccess = module.course.creatorId === userId || module.course.tutorId === userId;
        if (!hasAccess) {
            throw new Errors_1.ForbiddenError("Not authorized to delete this module");
        }
    }
    if (module._count.materials > 0) {
        throw new Errors_1.BadRequestError("Cannot delete module with existing materials");
    }
    await prisma_1.default.courseModule.delete({
        where: { id },
    });
};
exports.deleteModuleService = deleteModuleService;
const reorderModuleService = async (id, input, userId, userRole) => {
    const module = await prisma_1.default.courseModule.findUnique({
        where: { id },
        include: {
            course: {
                select: { creatorId: true },
            },
        },
    });
    if (!module) {
        throw new Errors_1.NotFoundError("Module not found");
    }
    if (module.course.creatorId !== userId && !isAdmin(userRole)) {
        throw new Errors_1.ForbiddenError("Not authorized to reorder this module");
    }
    const updatedModule = await prisma_1.default.courseModule.update({
        where: { id },
        data: { orderIndex: input.newOrderIndex },
    });
    return { module: updatedModule };
};
exports.reorderModuleService = reorderModuleService;
