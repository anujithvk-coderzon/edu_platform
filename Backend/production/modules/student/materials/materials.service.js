"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeMaterialService = exports.getMaterialByIdService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const progressCalculator_1 = require("../../../lib/progressCalculator");
/** Enrolment is the access check for every material operation. */
const requireEnrollment = async (studentId, courseId, action) => {
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) {
        throw new Errors_1.ForbiddenError(`You must be enrolled in this course to ${action}`);
    }
};
const getMaterialByIdService = async (studentId, materialId) => {
    const material = await prisma_1.default.material.findUnique({
        where: { id: materialId },
        include: {
            course: { select: { id: true, title: true, creatorId: true } },
        },
    });
    if (!material) {
        throw new Errors_1.NotFoundError("Material not found");
    }
    await requireEnrollment(studentId, material.courseId, "access materials");
    // Viewing counts as access; timeSpent accrues a minute per open.
    await prisma_1.default.progress.upsert({
        where: {
            studentId_courseId_materialId: {
                studentId,
                courseId: material.courseId,
                materialId: material.id,
            },
        },
        update: { lastAccessed: new Date(), timeSpent: { increment: 1 } },
        create: {
            studentId,
            courseId: material.courseId,
            materialId: material.id,
            lastAccessed: new Date(),
            timeSpent: 1,
        },
    });
    // fileUrl is resolved to an absolute URL by the media middleware on the way out.
    return { material };
};
exports.getMaterialByIdService = getMaterialByIdService;
const completeMaterialService = async (studentId, materialId) => {
    const material = await prisma_1.default.material.findUnique({
        where: { id: materialId },
        select: {
            id: true,
            courseId: true,
            course: { select: { id: true, title: true } },
        },
    });
    if (!material) {
        throw new Errors_1.NotFoundError("Material not found");
    }
    await requireEnrollment(studentId, material.courseId, "complete materials");
    await prisma_1.default.progress.upsert({
        where: {
            studentId_courseId_materialId: {
                studentId,
                courseId: material.courseId,
                materialId: material.id,
            },
        },
        update: { isCompleted: true, lastAccessed: new Date() },
        create: {
            studentId,
            courseId: material.courseId,
            materialId: material.id,
            isCompleted: true,
            lastAccessed: new Date(),
        },
    });
    const stats = await (0, progressCalculator_1.recalculateAndUpdateProgress)(studentId, material.courseId);
    return {
        progressPercentage: stats.progressPercentage,
        isCompleted: true,
        totalItems: stats.totalItems,
        completedItems: stats.completedItems,
    };
};
exports.completeMaterialService = completeMaterialService;
