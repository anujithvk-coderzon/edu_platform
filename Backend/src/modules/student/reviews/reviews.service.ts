import prisma from "../../../lib/prisma";
import { ForbiddenError } from "../../../errors/Errors";
import type { ReviewQuery, SubmitReviewInput } from "./reviews.validation";

export const submitReviewService = async (
  studentId: string,
  input: SubmitReviewInput,
) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: input.courseId } },
  });
  if (!enrollment) {
    throw new ForbiddenError(
      "You must be enrolled in this course to review it",
    );
  }

  const review = await prisma.review.upsert({
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

export const listCourseReviewsService = async (
  courseId: string,
  query: ReviewQuery,
) => {
  const skip = (query.page - 1) * query.limit;

  // Distribution is computed with one grouped query rather than pulling every
  // review row into memory.
  const [reviews, totalReviews, grouped] = await Promise.all([
    prisma.review.findMany({
      where: { courseId },
      // Explicit select: `include` also shipped studentId on every review,
      // handing reviewer identities to anyone who opened a course page.
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        student: { select: { firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.review.count({ where: { courseId } }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { courseId },
      _count: { rating: true },
    }),
  ]);

  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<
    number,
    number
  >;
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

export const getMyReviewService = async (
  studentId: string,
  courseId: string,
) => {
  const review = await prisma.review.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  return { review };
};
