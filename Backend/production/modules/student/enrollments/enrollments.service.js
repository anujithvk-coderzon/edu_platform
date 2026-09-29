"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnrollmentProgressService = exports.enrollInCourseService = exports.listMyEnrollmentsService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const listMyEnrollmentsService = async (studentId, query) => {
    const skip = (query.page - 1) * query.limit;
    const totalEnrollments = await prisma_1.default.enrollment.count({
        where: { studentId },
    });
    // Ordering depends on computed "is active", so the set is sorted in memory
    // before paginating.
    const allEnrollments = await prisma_1.default.enrollment.findMany({
        where: { studentId },
        select: {
            id: true,
            status: true,
            enrolledAt: true,
            completedAt: true,
            progressPercentage: true,
            hasNewContent: true,
            course: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    thumbnail: true,
                    price: true,
                    level: true,
                    duration: true,
                    tutorName: true,
                    creator: {
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                    },
                    _count: {
                        select: { enrollments: true, materials: true, reviews: true },
                    },
                },
            },
        },
    });
    // Active courses first, then completed; newest enrolment first within each.
    const sorted = allEnrollments.sort((a, b) => {
        const aIsActive = a.status !== "COMPLETED" && (a.progressPercentage ?? 0) < 100;
        const bIsActive = b.status !== "COMPLETED" && (b.progressPercentage ?? 0) < 100;
        if (aIsActive && !bIsActive)
            return -1;
        if (!aIsActive && bIsActive)
            return 1;
        return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
    });
    const page = sorted.slice(skip, skip + query.limit);
    const courseIds = page.map((e) => e.course.id);
    // Batched lookups for the page, rather than four queries per enrolment.
    const [ratings, userReviews, materials, progressRecords] = await Promise.all([
        prisma_1.default.review.groupBy({
            by: ["courseId"],
            where: { courseId: { in: courseIds } },
            _avg: { rating: true },
        }),
        prisma_1.default.review.findMany({
            where: { studentId, courseId: { in: courseIds } },
            select: { courseId: true },
        }),
        prisma_1.default.material.findMany({
            where: { courseId: { in: courseIds } },
            select: { id: true, courseId: true },
        }),
        prisma_1.default.progress.findMany({
            where: { studentId, courseId: { in: courseIds } },
        }),
    ]);
    const ratingMap = new Map(ratings.map((r) => [r.courseId, r._avg.rating || 0]));
    const reviewedSet = new Set(userReviews.map((r) => r.courseId));
    const materialIdsByCourse = new Map();
    for (const m of materials) {
        if (!materialIdsByCourse.has(m.courseId)) {
            materialIdsByCourse.set(m.courseId, new Set());
        }
        materialIdsByCourse.get(m.courseId).add(m.id);
    }
    const progressByCourse = new Map();
    for (const p of progressRecords) {
        if (!progressByCourse.has(p.courseId))
            progressByCourse.set(p.courseId, []);
        progressByCourse.get(p.courseId).push(p);
    }
    const enrichedEnrollments = page.map((enrollment) => {
        const courseId = enrollment.course.id;
        const records = progressByCourse.get(courseId) ?? [];
        const existingMaterialIds = materialIdsByCourse.get(courseId) ?? new Set();
        const totalTimeSpent = records.reduce((total, record) => total + (record.timeSpent || 0), 0);
        // Progress rows can outlive the material they point at.
        const completedMaterials = records.filter((record) => record.isCompleted &&
            record.materialId !== null &&
            existingMaterialIds.has(record.materialId)).length;
        const courseDurationMinutes = (enrollment.course?.duration || 10) * 60;
        const estimatedTimeSpent = totalTimeSpent > 0
            ? totalTimeSpent
            : enrollment.progressPercentage > 0
                ? Math.floor((enrollment.progressPercentage / 100) * courseDurationMinutes)
                : 0;
        return {
            ...enrollment,
            hasReviewed: reviewedSet.has(courseId),
            totalTimeSpent: estimatedTimeSpent,
            completedMaterials,
            course: {
                ...enrollment.course,
                averageRating: ratingMap.get(courseId) || 0,
            },
        };
    });
    return {
        enrollments: enrichedEnrollments,
        pagination: {
            total: totalEnrollments,
            page: query.page,
            limit: query.limit,
            pages: Math.ceil(totalEnrollments / query.limit),
        },
    };
};
exports.listMyEnrollmentsService = listMyEnrollmentsService;
const enrollInCourseService = async (studentId, courseId) => {
    const course = await prisma_1.default.course.findFirst({
        where: { id: courseId, status: "PUBLISHED", isPublic: true },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found or not available for enrollment");
    }
    const existing = await prisma_1.default.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) {
        throw new Errors_1.BadRequestError("Already enrolled in this course");
    }
    const enrollment = await prisma_1.default.enrollment.create({
        data: { studentId, courseId, progressPercentage: 0, status: "ACTIVE" },
        include: {
            course: { select: { id: true, title: true, thumbnail: true } },
        },
    });
    return { enrollment };
};
exports.enrollInCourseService = enrollInCourseService;
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
                description: true,
                type: true,
                fileUrl: true,
                content: true,
                moduleId: true,
                orderIndex: true,
                module: {
                    select: { id: true, title: true, description: true, orderIndex: true },
                },
            },
            orderBy: [{ module: { orderIndex: "asc" } }, { orderIndex: "asc" }],
        }),
        prisma_1.default.progress.findMany({ where: { studentId, courseId } }),
    ]);
    const progressMap = new Map(progressRecords.map((p) => [p.materialId, p]));
    // fileUrl is resolved to an absolute URL by the media middleware on the way
    // out; only the legacy local-upload form needs the backend host here.
    const materialsWithProgress = materials.map((material) => ({
        ...material,
        progress: progressMap.get(material.id) || null,
    }));
    const [assignments, assignmentSubmissions] = await Promise.all([
        prisma_1.default.assignment.findMany({
            where: { courseId },
            select: {
                id: true,
                title: true,
                description: true,
                dueDate: true,
                maxScore: true,
                createdAt: true,
            },
            orderBy: { createdAt: "asc" },
        }),
        prisma_1.default.assignmentSubmission.findMany({
            where: { studentId, assignment: { courseId } },
            select: {
                id: true,
                assignmentId: true,
                submittedAt: true,
                status: true,
                score: true,
                feedback: true,
            },
        }),
    ]);
    const submissionMap = new Map(assignmentSubmissions.map((s) => [s.assignmentId, s]));
    const assignmentsWithSubmissions = assignments.map((assignment) => ({
        ...assignment,
        submission: submissionMap.get(assignment.id) || null,
    }));
    const totalMaterials = materials.length;
    const existingMaterialIds = new Set(materials.map((m) => m.id));
    const completedMaterials = progressRecords.filter((p) => p.isCompleted && existingMaterialIds.has(p.materialId)).length;
    const totalAssignments = assignments.length;
    const submittedAssignments = assignmentSubmissions.length;
    const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
    const totalItems = totalMaterials + totalAssignments;
    const completedItems = completedMaterials + submittedAssignments;
    const overallProgressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return {
        enrollment: { ...enrollment, progressPercentage: overallProgressPercentage },
        materials: materialsWithProgress,
        assignments: assignmentsWithSubmissions,
        stats: {
            totalMaterials,
            completedMaterials,
            totalAssignments,
            submittedAssignments,
            progressPercentage: overallProgressPercentage,
            totalTimeSpent,
        },
    };
};
exports.getEnrollmentProgressService = getEnrollmentProgressService;
