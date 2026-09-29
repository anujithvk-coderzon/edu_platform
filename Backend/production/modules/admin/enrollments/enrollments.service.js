"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEnrollmentService = exports.getEnrollmentProgressService = exports.updateEnrollmentStatusService = exports.getCourseStudentsService = exports.getMyEnrollmentsService = exports.enrollInCourseService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const progressCalculator_1 = require("../../../lib/progressCalculator");
const enrollInCourseService = async (studentId, courseId) => {
    const course = await prisma_1.default.course.findUnique({ where: { id: courseId } });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    // Only published, public courses accept self-enrolment.
    if (!course.isPublic || course.status !== "PUBLISHED") {
        throw new Errors_1.BadRequestError("Course is not available for enrollment");
    }
    const existingEnrollment = await prisma_1.default.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (existingEnrollment) {
        throw new Errors_1.BadRequestError("Already enrolled in this course");
    }
    const enrollment = await prisma_1.default.enrollment.create({
        data: { studentId, courseId, status: "ACTIVE" },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    thumbnail: true,
                    creator: {
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                    },
                },
            },
        },
    });
    return { enrollment };
};
exports.enrollInCourseService = enrollInCourseService;
const getMyEnrollmentsService = async (studentId) => {
    const enrollments = await prisma_1.default.enrollment.findMany({
        where: { studentId },
        include: {
            course: {
                include: {
                    creator: {
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                    },
                    _count: { select: { materials: true, reviews: true } },
                },
            },
        },
        orderBy: { enrolledAt: "desc" },
    });
    const enrollmentsWithProgress = await Promise.all(enrollments.map(async (enrollment) => {
        // Materials that still exist for this course.
        const existingMaterials = await prisma_1.default.material.findMany({
            where: { courseId: enrollment.courseId },
            select: { id: true },
        });
        const existingMaterialIds = new Set(existingMaterials.map((m) => m.id));
        const progressRecords = await prisma_1.default.progress.findMany({
            where: { studentId, courseId: enrollment.courseId },
        });
        // Progress rows can outlive the material they point at, so the stored
        // `completedMaterials` is recomputed against the surviving materials.
        const completedCount = progressRecords.filter((p) => p.isCompleted &&
            p.materialId !== null &&
            existingMaterialIds.has(p.materialId)).length;
        const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
        return {
            ...enrollment,
            completedMaterials: completedCount,
            totalTimeSpent,
        };
    }));
    return { enrollments: enrollmentsWithProgress };
};
exports.getMyEnrollmentsService = getMyEnrollmentsService;
const getCourseStudentsService = async (callerId, callerRole, courseId) => {
    const course = await prisma_1.default.course.findUnique({ where: { id: courseId } });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    // The course owner sees its roster; an Admin sees any roster.
    if (course.creatorId !== callerId && callerRole !== "Admin") {
        throw new Errors_1.ForbiddenError("Not authorized to view course students");
    }
    const enrollments = await prisma_1.default.enrollment.findMany({
        where: { courseId },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                },
            },
        },
        orderBy: { enrolledAt: "desc" },
    });
    // Fetched once for the whole roster rather than per student.
    const existingMaterials = await prisma_1.default.material.findMany({
        where: { courseId },
        select: { id: true },
    });
    const existingMaterialIds = new Set(existingMaterials.map((m) => m.id));
    const studentsWithProgress = await Promise.all(enrollments.map(async (enrollment) => {
        const progressRecords = await prisma_1.default.progress.findMany({
            where: { studentId: enrollment.studentId, courseId },
        });
        // Only count progress for materials that still exist.
        const completedCount = progressRecords.filter((p) => p.isCompleted &&
            p.materialId !== null &&
            existingMaterialIds.has(p.materialId)).length;
        const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
        const lastAccessed = progressRecords.length > 0
            ? Math.max(...progressRecords.map((p) => p.lastAccessed.getTime()))
            : null;
        return {
            ...enrollment,
            completedMaterials: completedCount,
            totalTimeSpent,
            lastAccessed: lastAccessed ? new Date(lastAccessed) : null,
        };
    }));
    return { students: studentsWithProgress };
};
exports.getCourseStudentsService = getCourseStudentsService;
const updateEnrollmentStatusService = async (callerId, callerRole, enrollmentId, status) => {
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { course: { select: { creatorId: true, tutorId: true } } },
    });
    if (!enrollment) {
        throw new Errors_1.NotFoundError("Enrollment not found");
    }
    // The enrolled student, the course creator, or any Admin may change status.
    const canModify = enrollment.studentId === callerId ||
        enrollment.course.creatorId === callerId ||
        callerRole === "Admin";
    if (!canModify) {
        throw new Errors_1.ForbiddenError("Not authorized to modify this enrollment");
    }
    const updatedEnrollment = await prisma_1.default.enrollment.update({
        where: { id: enrollmentId },
        data: {
            status,
            ...(status === "COMPLETED" && { completedAt: new Date() }),
        },
        include: {
            course: { select: { id: true, title: true, thumbnail: true } },
            student: {
                select: { id: true, firstName: true, lastName: true, email: true },
            },
        },
    });
    return { enrollment: updatedEnrollment };
};
exports.updateEnrollmentStatusService = updateEnrollmentStatusService;
const getEnrollmentProgressService = async (studentId, courseId) => {
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) {
        throw new Errors_1.NotFoundError("Enrollment not found");
    }
    const [materials, progressRecords] = await Promise.all([
        prisma_1.default.material.findMany({
            where: { courseId },
            select: {
                id: true,
                title: true,
                type: true,
                moduleId: true,
                orderIndex: true,
            },
            orderBy: [{ moduleId: "asc" }, { orderIndex: "asc" }],
        }),
        prisma_1.default.progress.findMany({ where: { studentId, courseId } }),
    ]);
    const progressMap = new Map(progressRecords.map((p) => [p.materialId, p]));
    const materialsWithProgress = materials.map((material) => ({
        ...material,
        progress: progressMap.get(material.id) || null,
    }));
    const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
    // Centralized calculator so the percentage counts assignments as well as
    // materials, matching every other progress endpoint.
    const progressStats = await (0, progressCalculator_1.calculateCourseProgress)(studentId, courseId);
    return {
        enrollment,
        materials: materialsWithProgress,
        stats: {
            totalMaterials: progressStats.totalMaterials,
            completedMaterials: progressStats.completedMaterials,
            totalAssignments: progressStats.totalAssignments,
            submittedAssignments: progressStats.submittedAssignments,
            progressPercentage: progressStats.progressPercentage,
            totalTimeSpent,
        },
    };
};
exports.getEnrollmentProgressService = getEnrollmentProgressService;
const deleteEnrollmentService = async (callerId, callerRole, enrollmentId) => {
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { course: { select: { creatorId: true, title: true } } },
    });
    if (!enrollment) {
        throw new Errors_1.NotFoundError("Enrollment not found");
    }
    // Same ownership rule as the status update.
    const canDelete = enrollment.studentId === callerId ||
        enrollment.course.creatorId === callerId ||
        callerRole === "Admin";
    if (!canDelete) {
        throw new Errors_1.ForbiddenError("Not authorized to delete this enrollment");
    }
    await prisma_1.default.enrollment.delete({ where: { id: enrollmentId } });
};
exports.deleteEnrollmentService = deleteEnrollmentService;
