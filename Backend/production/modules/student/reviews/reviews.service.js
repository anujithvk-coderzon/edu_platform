"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyReviewService = exports.listCourseReviewsService = exports.submitReviewService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const submitReviewService = async (studentId, input) => {
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId: input.courseId } },
    });
    if (!enrollment) {
        throw new Errors_1.ForbiddenError("You must be enrolled in this course to review it");
    }
    const review = await prisma_1.default.review.upsert({
        where: { courseId_studentId: { courseId: input.courseId, studentId } },
        update: { rating: input.rating, comment: input.comment || null },
        create: {
            courseId: input.courseId,
            studentId,
            rating: input.rating,
            comment: input.comment || null,
        },
    });
    return { review };
};
exports.submitReviewService = submitReviewService;
const listCourseReviewsService = async (courseId, query) => {
    const skip = (query.page - 1) * query.limit;
    // Distribution is computed with one grouped query rather than pulling every
    // review row into memory.
    const [reviews, totalReviews, grouped] = await Promise.all([
        prisma_1.default.review.findMany({
            where: { courseId },
            include: {
                student: { select: { firstName: true, lastName: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: query.limit,
        }),
        prisma_1.default.review.count({ where: { courseId } }),
        prisma_1.default.review.groupBy({
            by: ["rating"],
            where: { courseId },
            _count: { rating: true },
        }),
    ]);
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;
    for (const row of grouped) {
        ratingDistribution[row.rating] = row._count.rating;
        ratingSum += row.rating * row._count.rating;
    }
    const averageRating = totalReviews > 0 ? ratingSum / totalReviews : 0;
    const totalPages = Math.ceil(totalReviews / query.limit);
    return {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution,
        pagination: {
            page: query.page,
            limit: query.limit,
            totalPages,
            hasMore: query.page < totalPages,
        },
    };
};
exports.listCourseReviewsService = listCourseReviewsService;
const getMyReviewService = async (studentId, courseId) => {
    const review = await prisma_1.default.review.findUnique({
        where: { courseId_studentId: { courseId, studentId } },
    });
    return { review };
};
exports.getMyReviewService = getMyReviewService;
