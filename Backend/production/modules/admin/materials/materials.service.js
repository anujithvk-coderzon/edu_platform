"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeMaterialService = exports.deleteMaterialService = exports.updateMaterialService = exports.createMaterialService = exports.getMaterialByIdService = exports.getCourseMaterialsService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const client_1 = require("../../../generated/prisma/client");
const cdnStorage_1 = require("../../../lib/cdnStorage");
const bunnyStream_1 = require("../../../lib/bunnyStream");
const progressCalculator_1 = require("../../../lib/progressCalculator");
/** Author block returned alongside every material. */
const authorSelect = {
    id: true,
    firstName: true,
    lastName: true,
    avatar: true,
};
/** The owning chapter, trimmed to what the admin UI renders. */
const moduleSelect = {
    id: true,
    title: true,
};
/**
 * Access control: an Admin reaches every course; a Tutor only reaches the
 * courses they created or were assigned to.
 */
const assertCourseAccess = (caller, course, message) => {
    if (caller.role === "Admin")
        return;
    const hasAccess = course.creatorId === caller.id || course.tutorId === caller.id;
    if (!hasAccess) {
        throw new Errors_1.ForbiddenError(message);
    }
};
/**
 * Removes the stored asset that backs a material.
 *
 * VIDEO materials store a bare Bunny Stream GUID, everything else stores a
 * bare relative CDN path — both helpers below need those raw values, so the
 * `fileUrl` handed in here must be the database value, never an absolute URL
 * rebuilt by the media middleware.
 */
const deleteMaterialAsset = async (type, fileUrl) => {
    if (type === client_1.MaterialType.VIDEO) {
        const guid = fileUrl;
        console.log(`🎬 Deleting video from Bunny Stream: ${guid}`);
        const deleted = await (0, bunnyStream_1.deleteVideoFromBunnyStream)(guid);
        if (deleted) {
            console.log(`✅ Deleted video from Bunny Stream: ${guid}`);
        }
        else {
            console.log(`⚠️ Failed to delete video from Bunny Stream: ${guid}`);
        }
        return;
    }
    // PDF (and any other storage-backed type) lives in Bunny Storage.
    await (0, cdnStorage_1.Delete_File)(fileUrl);
    console.log(`✅ Deleted material from Bunny Storage: ${fileUrl}`);
};
/**
 * Recalculates progress for every enrollment in a course after its material
 * set changes.
 *
 * Completed status is preserved: a student who already finished the course
 * never has their progress reduced by newly added content — they are flagged
 * with `hasNewContent` instead. Failures are logged and swallowed so that
 * creating or deleting a material never fails on a bookkeeping error.
 */
const recalculateCourseEnrollments = async (courseId) => {
    try {
        const enrollments = await prisma_1.default.enrollment.findMany({
            where: { courseId },
            select: {
                studentId: true,
                completedAt: true,
                status: true,
                progressPercentage: true,
            },
        });
        const [materials, assignments] = await Promise.all([
            prisma_1.default.material.findMany({
                where: { courseId },
                select: { id: true, createdAt: true },
            }),
            prisma_1.default.assignment.findMany({ where: { courseId }, select: { id: true } }),
        ]);
        const existingMaterialIds = materials.map((m) => m.id);
        const totalItems = materials.length + assignments.length;
        for (const enrollment of enrollments) {
            const wasCompleted = !!enrollment.completedAt;
            // Material added after the completion date counts as new content.
            let hasNewContent = false;
            if (wasCompleted && enrollment.completedAt) {
                hasNewContent = materials.some((m) => m.createdAt > enrollment.completedAt);
            }
            const [completedMaterialsCount, submittedAssignmentsCount] = await Promise.all([
                prisma_1.default.progress.count({
                    where: {
                        studentId: enrollment.studentId,
                        courseId,
                        isCompleted: true,
                        materialId: { in: existingMaterialIds },
                    },
                }),
                prisma_1.default.assignmentSubmission.count({
                    where: {
                        studentId: enrollment.studentId,
                        assignment: { courseId },
                    },
                }),
            ]);
            const completedItems = completedMaterialsCount + submittedAssignmentsCount;
            const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
            if (wasCompleted) {
                // Keep status COMPLETED and progress at 100%; only refresh the count
                // and clear the new-content flag once they have caught up.
                const finalHasNewContent = progressPercentage === 100 ? false : hasNewContent;
                await prisma_1.default.enrollment.update({
                    where: { studentId_courseId: { studentId: enrollment.studentId, courseId } },
                    data: {
                        completedMaterials: completedMaterialsCount,
                        hasNewContent: finalHasNewContent,
                    },
                });
            }
            else {
                await prisma_1.default.enrollment.update({
                    where: { studentId_courseId: { studentId: enrollment.studentId, courseId } },
                    data: {
                        progressPercentage,
                        completedMaterials: completedMaterialsCount,
                        hasNewContent: false,
                        ...(progressPercentage === 100 && {
                            status: "COMPLETED",
                            completedAt: new Date(),
                        }),
                        ...(progressPercentage < 100 &&
                            enrollment.status === "COMPLETED" && {
                            status: "ACTIVE",
                            completedAt: null,
                        }),
                    },
                });
            }
        }
    }
    catch (error) {
        console.error("Error recalculating course enrollments:", error);
    }
};
const getCourseMaterialsService = async (courseId) => {
    const course = await prisma_1.default.course.findUnique({ where: { id: courseId } });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    // Grouped by chapter, then by the order the admin arranged them in.
    const materials = await prisma_1.default.material.findMany({
        where: { courseId },
        include: {
            author: { select: authorSelect },
            module: { select: moduleSelect },
        },
        orderBy: [{ moduleId: "asc" }, { orderIndex: "asc" }],
    });
    return { materials };
};
exports.getCourseMaterialsService = getCourseMaterialsService;
const getMaterialByIdService = async (callerId, materialId) => {
    const material = await prisma_1.default.material.findUnique({
        where: { id: materialId },
        include: {
            course: { select: { id: true, title: true, creatorId: true } },
            author: { select: authorSelect },
            module: { select: moduleSelect },
        },
    });
    if (!material) {
        throw new Errors_1.NotFoundError("Material not found");
    }
    // Opening a material counts as access; timeSpent accrues a minute per open.
    await prisma_1.default.progress.upsert({
        where: {
            studentId_courseId_materialId: {
                studentId: callerId,
                courseId: material.courseId,
                materialId: material.id,
            },
        },
        update: { lastAccessed: new Date(), timeSpent: { increment: 1 } },
        create: {
            studentId: callerId,
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
const createMaterialService = async (caller, input) => {
    const course = await prisma_1.default.course.findUnique({ where: { id: input.courseId } });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    assertCourseAccess(caller, course, "Not authorized to add materials to this course");
    // A LINK material is nothing but its URL, so it cannot be created without one.
    if (input.type === client_1.MaterialType.LINK && !input.fileUrl) {
        throw new Errors_1.BadRequestError("File URL is required for LINK type materials");
    }
    const material = await prisma_1.default.material.create({
        data: {
            title: input.title,
            description: input.description,
            type: input.type,
            fileUrl: input.fileUrl,
            content: input.content,
            orderIndex: input.orderIndex,
            courseId: input.courseId,
            moduleId: input.moduleId,
            authorId: caller.id,
            isPublic: input.isPublic,
        },
        include: {
            author: { select: authorSelect },
            module: { select: moduleSelect },
        },
    });
    // The course just gained an item, so every enrollment's share of it moves.
    await recalculateCourseEnrollments(input.courseId);
    return { material };
};
exports.createMaterialService = createMaterialService;
const updateMaterialService = async (caller, materialId, input) => {
    // Only the keys the client actually sent reach Prisma.
    const updates = {};
    if (input.title)
        updates.title = input.title;
    if (input.description !== undefined)
        updates.description = input.description;
    if (input.type)
        updates.type = input.type;
    if (input.fileUrl !== undefined)
        updates.fileUrl = input.fileUrl;
    if (input.content !== undefined)
        updates.content = input.content;
    if (input.orderIndex !== undefined)
        updates.orderIndex = input.orderIndex;
    if (input.moduleId !== undefined)
        updates.moduleId = input.moduleId;
    if (typeof input.isPublic === "boolean")
        updates.isPublic = input.isPublic;
    const existingMaterial = await prisma_1.default.material.findUnique({
        where: { id: materialId },
        include: {
            course: { select: { creatorId: true, tutorId: true } },
        },
    });
    if (!existingMaterial) {
        throw new Errors_1.NotFoundError("Material not found");
    }
    assertCourseAccess(caller, existingMaterial.course, "Not authorized to update this material");
    // Swapping the file in means the old asset is now orphaned — drop it. The
    // stored (bare) fileUrl is passed through untouched, and the *existing*
    // type decides where it lives. A failure here must not block the update.
    if (input.fileUrl !== undefined &&
        existingMaterial.fileUrl &&
        existingMaterial.fileUrl !== input.fileUrl &&
        existingMaterial.type !== client_1.MaterialType.LINK) {
        try {
            await deleteMaterialAsset(existingMaterial.type, existingMaterial.fileUrl);
        }
        catch (error) {
            console.error(`❌ Error deleting old material file: ${existingMaterial.fileUrl}`, error);
            // Continue with update even if deletion fails
        }
    }
    const material = await prisma_1.default.material.update({
        where: { id: materialId },
        data: updates,
        include: {
            author: { select: authorSelect },
            module: { select: moduleSelect },
        },
    });
    return { material };
};
exports.updateMaterialService = updateMaterialService;
const deleteMaterialService = async (caller, materialId) => {
    const material = await prisma_1.default.material.findUnique({
        where: { id: materialId },
        include: {
            course: { select: { creatorId: true, tutorId: true } },
        },
    });
    if (!material) {
        throw new Errors_1.NotFoundError("Material not found");
    }
    assertCourseAccess(caller, material.course, "Not authorized to delete this material");
    // A LINK owns no asset; everything else does. The stored bare value goes
    // straight to the CDN helpers.
    if (material.fileUrl && material.type !== client_1.MaterialType.LINK) {
        await deleteMaterialAsset(material.type, material.fileUrl);
    }
    const courseId = material.courseId;
    await prisma_1.default.material.delete({ where: { id: materialId } });
    // The course just lost an item, so every enrollment's share of it moves.
    await recalculateCourseEnrollments(courseId);
};
exports.deleteMaterialService = deleteMaterialService;
const completeMaterialService = async (callerId, materialId) => {
    const material = await prisma_1.default.material.findUnique({
        where: { id: materialId },
        select: { id: true, courseId: true },
    });
    if (!material) {
        throw new Errors_1.NotFoundError("Material not found");
    }
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: {
            studentId_courseId: { studentId: callerId, courseId: material.courseId },
        },
    });
    if (!enrollment) {
        throw new Errors_1.ForbiddenError("You are not enrolled in this course");
    }
    await prisma_1.default.progress.upsert({
        where: {
            studentId_courseId_materialId: {
                studentId: callerId,
                courseId: material.courseId,
                materialId: material.id,
            },
        },
        update: { isCompleted: true, lastAccessed: new Date() },
        create: {
            studentId: callerId,
            courseId: material.courseId,
            materialId: material.id,
            isCompleted: true,
            lastAccessed: new Date(),
        },
    });
    // Centralized calculator — it counts both materials and assignments.
    const stats = await (0, progressCalculator_1.recalculateAndUpdateProgress)(callerId, material.courseId);
    return {
        progressPercentage: stats.progressPercentage,
        isCompleted: true,
    };
};
exports.completeMaterialService = completeMaterialService;
