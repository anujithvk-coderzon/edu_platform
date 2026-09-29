import prisma from "../../../lib/prisma";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const getPlatformStatsService = async () => {
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: {
      enrollments: { select: { studentId: true, enrolledAt: true } },
      reviews: { select: { rating: true } },
    },
  });

  const uniqueStudentIds = new Set<string>();
  let totalEnrollments = 0;
  let recentActivity = 0;
  let ratingSum = 0;
  let totalReviews = 0;

  for (const course of courses) {
    for (const enrollment of course.enrollments) {
      uniqueStudentIds.add(enrollment.studentId);
      totalEnrollments++;
      if (new Date(enrollment.enrolledAt) > thirtyDaysAgo) recentActivity++;
    }
    for (const review of course.reviews) {
      ratingSum += review.rating;
      totalReviews++;
    }
  }

  const averageRating = totalReviews > 0 ? ratingSum / totalReviews : 0;

  return {
    totalCourses: courses.length,
    totalStudents: uniqueStudentIds.size,
    totalEnrollments,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    recentActivity,
    lastUpdated: new Date().toISOString(),
  };
};
