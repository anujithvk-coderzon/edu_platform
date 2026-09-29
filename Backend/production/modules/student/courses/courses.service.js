"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseByIdService = exports.listCategoriesService = exports.listCoursesService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
/** Catalogue card shape — kept identical to the previous handler's select. */
const courseCardSelect = {
    id: true,
    title: true,
    description: true,
    thumbnail: true,
    price: true,
    level: true,
    duration: true,
    status: true,
    isPublic: true,
    creatorId: true,
    tutorName: true,
    createdAt: true,
    creator: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
    },
    tutor: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
    },
    category: { select: { id: true, name: true } },
    _count: { select: { enrollments: true, reviews: true, materials: true } },
};
const buildWhere = (query) => {
    const where = { status: "PUBLISHED", isPublic: true };
    if (query.category) {
        where.category = {
            name: { contains: query.category, mode: "insensitive" },
        };
    }
    if (query.level) {
        where.level = query.level;
    }
    if (query.search) {
        where.OR = [
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
        ];
    }
    switch (query.price) {
        case "free":
            where.price = 0;
            break;
        case "0-50":
            where.price = { gt: 0, lte: 50 };
            break;
        case "50-100":
            where.price = { gt: 50, lte: 100 };
            break;
        case "100+":
            where.price = { gt: 100 };
            break;
    }
    return where;
};
const buildOrderBy = (sort) => {
    switch (sort) {
        case "price-asc":
            return { price: "asc" };
        case "price-desc":
            return { price: "desc" };
        // Rating is computed, so it is sorted in memory after fetching.
        default:
            return { createdAt: "desc" };
    }
};
const listCoursesService = async (query, studentId) => {
    const skip = (query.page - 1) * query.limit;
    const where = buildWhere(query);
    // Rating is not a column, so that sort needs the full set before paginating.
    const shouldFetchAll = query.sort === "rating";
    const [courses, total] = await Promise.all([
        prisma_1.default.course.findMany({
            where,
            select: courseCardSelect,
            skip: shouldFetchAll ? undefined : skip,
            take: shouldFetchAll ? undefined : query.limit,
            orderBy: buildOrderBy(query.sort),
        }),
        prisma_1.default.course.count({ where }),
    ]);
    const courseIds = courses.map((c) => c.id);
    // One grouped query for every course's average rating.
    const ratingsData = await prisma_1.default.review.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds } },
        _avg: { rating: true },
    });
    const ratingsMap = new Map(ratingsData.map((r) => [r.courseId, r._avg.rating || 0]));
    let enrollmentsMap = new Map();
    let reviewsMap = new Map();
    if (studentId) {
        const [enrollments, reviews] = await Promise.all([
            prisma_1.default.enrollment.findMany({
                where: { studentId, courseId: { in: courseIds } },
                select: {
                    courseId: true,
                    status: true,
                    progressPercentage: true,
                    hasNewContent: true,
                },
            }),
            prisma_1.default.review.findMany({
                where: { studentId, courseId: { in: courseIds } },
                select: { courseId: true },
            }),
        ]);
        enrollmentsMap = new Map(enrollments.map((e) => [e.courseId, e]));
        reviewsMap = new Map(reviews.map((r) => [r.courseId, true]));
    }
    let coursesWithAvgRating = courses.map((course) => {
        const enrollment = enrollmentsMap.get(course.id);
        return {
            ...course,
            averageRating: ratingsMap.get(course.id) || 0,
            isEnrolled: !!enrollment,
            enrollmentStatus: enrollment?.status,
            progressPercentage: enrollment?.progressPercentage || 0,
            hasReviewed: reviewsMap.get(course.id) || false,
            hasNewContent: enrollment?.hasNewContent || false,
        };
    });
    if (query.sort === "rating") {
        coursesWithAvgRating.sort((a, b) => b.averageRating - a.averageRating);
        coursesWithAvgRating = coursesWithAvgRating.slice(skip, skip + query.limit);
    }
    return {
        courses: coursesWithAvgRating,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            pages: Math.ceil(total / query.limit),
        },
    };
};
exports.listCoursesService = listCoursesService;
const listCategoriesService = async () => {
    const categories = await prisma_1.default.category.findMany({
        include: {
            _count: {
                select: {
                    courses: { where: { status: "PUBLISHED", isPublic: true } },
                },
            },
        },
        orderBy: { name: "asc" },
    });
    return { categories };
};
exports.listCategoriesService = listCategoriesService;
const getCourseByIdService = async (courseId, studentId) => {
    const course = await prisma_1.default.course.findUnique({
        where: { id: courseId, status: "PUBLISHED", isPublic: true },
        select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            price: true,
            level: true,
            duration: true,
            tutorName: true,
            requirements: true,
            prerequisites: true,
            creator: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            tutor: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            modules: {
                include: {
                    materials: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            type: true,
                            orderIndex: true,
                        },
                        orderBy: { orderIndex: "asc" },
                    },
                },
                orderBy: { orderIndex: "asc" },
            },
            reviews: {
                include: {
                    student: {
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            _count: { select: { enrollments: true, materials: true, reviews: true } },
        },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    let isEnrolled = false;
    let hasReviewed = false;
    let enrollmentStatus = null;
    let progressPercentage = 0;
    if (studentId) {
        const [enrollment, userReview] = await Promise.all([
            prisma_1.default.enrollment.findUnique({
                where: { studentId_courseId: { studentId, courseId } },
            }),
            prisma_1.default.review.findUnique({
                where: { courseId_studentId: { courseId, studentId } },
            }),
        ]);
        isEnrolled = !!enrollment;
        if (enrollment) {
            enrollmentStatus = enrollment.status;
            progressPercentage = enrollment.progressPercentage;
        }
        hasReviewed = !!userReview;
    }
    const reviews = await prisma_1.default.review.findMany({
        where: { courseId },
        select: { rating: true },
    });
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
    return {
        course: {
            ...course,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length,
            isEnrolled,
            hasReviewed,
            enrollmentStatus,
            progressPercentage,
        },
    };
};
exports.getCourseByIdService = getCourseByIdService;
