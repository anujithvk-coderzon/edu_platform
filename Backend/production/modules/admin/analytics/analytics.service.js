"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseCompletionService = exports.getTutorAnalyticsService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
/**
 * Dashboard analytics for the caller.
 *
 * Admins see every course; a Tutor only sees the courses they created or were
 * assigned to. Revenue is hard-coded to 0 everywhere because no payment system
 * exists yet, and the monthly series are derived from the student total rather
 * than real history.
 */
const getTutorAnalyticsService = async (userId, userRole) => {
    // Build where clause based on role
    const whereClause = userRole === "Admin"
        ? {} // Admins see ALL courses
        : { OR: [{ creatorId: userId }, { tutorId: userId }] }; // Tutors see only their courses (created or assigned)
    // Get courses with enrollment counts and reviews
    const courses = await prisma_1.default.course.findMany({
        where: whereClause,
        include: {
            _count: {
                select: {
                    enrollments: true,
                    materials: true,
                    reviews: true,
                },
            },
            materials: true,
            reviews: {
                select: {
                    rating: true,
                },
            },
            enrollments: {
                select: {
                    id: true,
                    studentId: true,
                    courseId: true,
                    status: true,
                    progressPercentage: true,
                    enrolledAt: true,
                    completedAt: true,
                },
            },
        },
    });
    // Get accurate counts from database
    const [totalStudentsFromDB, totalEnrollmentsFromDB] = await Promise.all([
        prisma_1.default.student.count(), // Total students in database
        userRole === "Admin"
            ? prisma_1.default.enrollment.count() // Admin sees all enrollments
            : prisma_1.default.enrollment.count({
                where: {
                    course: {
                        OR: [{ creatorId: userId }, { tutorId: userId }],
                    },
                },
            }),
    ]);
    // Calculate completion rates based on actual progress data
    let totalMaterials = 0;
    let totalCompletedMaterials = 0;
    let totalReviews = 0;
    let weightedRating = 0;
    const courseAnalytics = courses.map((course) => {
        const materialCount = course.materials.length;
        const reviewCount = course._count.reviews;
        // The enrollment rows above are unfiltered, so their length is the same
        // number a `enrollment.count({ where: { courseId } })` would return.
        const studentCount = course.enrollments.length;
        // Calculate completion rate for this course based on progressPercentage
        let completionRate = 0;
        if (course.enrollments.length > 0) {
            const totalProgressPercentage = course.enrollments.reduce((sum, enrollment) => sum + enrollment.progressPercentage, 0);
            completionRate = totalProgressPercentage / course.enrollments.length;
        }
        // Calculate average rating for this course
        let courseRating = 0;
        if (course.reviews.length > 0) {
            const totalRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
            courseRating = totalRating / course.reviews.length;
            weightedRating += totalRating; // Add to overall weighted rating
        }
        totalMaterials += materialCount * studentCount;
        totalCompletedMaterials += course.enrollments.reduce((sum, enrollment) => sum + Math.floor((enrollment.progressPercentage / 100) * materialCount), 0);
        totalReviews += reviewCount;
        return {
            id: course.id,
            title: course.title,
            students: studentCount,
            revenue: 0, // No payment system implemented yet
            rating: Math.round(courseRating * 10) / 10, // Round to 1 decimal place
            completionRate: Math.round(completionRate * 100) / 100,
            materials: materialCount,
            enrollments: [
                { date: "2024-01", count: Math.floor(studentCount * 0.2) },
                { date: "2024-02", count: Math.floor(studentCount * 0.3) },
                { date: "2024-03", count: Math.floor(studentCount * 0.5) },
            ],
        };
    });
    // Calculate overall completion rate
    const overallCompletionRate = totalMaterials > 0 ? (totalCompletedMaterials / totalMaterials) * 100 : 0;
    // Calculate growth rates (would need historical data for real growth)
    const thisMonthStudents = Math.floor(totalStudentsFromDB * 0.2);
    const lastMonthStudents = Math.floor(totalStudentsFromDB * 0.18);
    const analytics = {
        revenue: {
            total: 0, // No payment system implemented yet
            thisMonth: 0, // No payment system implemented yet
            lastMonth: 0, // No payment system implemented yet
            growth: 0, // No payment system implemented yet
        },
        students: {
            total: totalStudentsFromDB, // Total students from database
            enrollments: totalEnrollmentsFromDB, // Total enrollments from database
            thisMonth: thisMonthStudents,
            lastMonth: lastMonthStudents,
            growth: lastMonthStudents > 0
                ? ((thisMonthStudents - lastMonthStudents) / lastMonthStudents) * 100
                : 0,
        },
        courses: {
            total: courses.length,
            published: courses.filter((c) => c.status === "PUBLISHED").length,
            draft: courses.filter((c) => c.status === "DRAFT").length,
            archived: courses.filter((c) => c.status === "ARCHIVED").length,
        },
        engagement: {
            totalEnrollments: totalEnrollmentsFromDB, // Total enrollment count from database
            avgRating: totalReviews > 0 ? weightedRating / totalReviews : 0,
            totalReviews: totalReviews,
            completionRate: Math.round(overallCompletionRate * 100) / 100,
        },
    };
    // No payment system implemented yet, so every revenue point is 0
    const revenueData = [
        {
            date: "2024-01",
            revenue: 0,
            students: Math.floor(totalStudentsFromDB * 0.2),
        },
        {
            date: "2024-02",
            revenue: 0,
            students: Math.floor(totalStudentsFromDB * 0.3),
        },
        {
            date: "2024-03",
            revenue: 0,
            students: Math.floor(totalStudentsFromDB * 0.5),
        },
    ];
    return { analytics, courseAnalytics, revenueData };
};
exports.getTutorAnalyticsService = getTutorAnalyticsService;
/**
 * Per-student completion for one course.
 *
 * Ownership is checked against `creatorId` for every caller — an Admin who did
 * not create the course gets the same "Course not found" as a stranger.
 */
const getCourseCompletionService = async (tutorId, courseId) => {
    // Verify course ownership
    const course = await prisma_1.default.course.findFirst({
        where: {
            id: courseId,
            creatorId: tutorId,
        },
        include: {
            materials: true,
            enrollments: {
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    const materialCount = course.materials.length;
    const studentProgress = course.enrollments.map((enrollment) => {
        const completionRate = enrollment.progressPercentage;
        const completedMaterials = Math.floor((completionRate / 100) * materialCount);
        return {
            studentId: enrollment.studentId,
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
            completedMaterials,
            totalMaterials: materialCount,
            completionRate: Math.round(completionRate * 100) / 100,
        };
    });
    return {
        courseId,
        courseName: course.title,
        totalMaterials: materialCount,
        totalStudents: course.enrollments.length,
        studentProgress,
    };
};
exports.getCourseCompletionService = getCourseCompletionService;
