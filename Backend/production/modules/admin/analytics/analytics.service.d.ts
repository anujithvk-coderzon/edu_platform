type AdminRole = "Admin" | "Tutor";
/**
 * Dashboard analytics for the caller.
 *
 * Admins see every course; a Tutor only sees the courses they created or were
 * assigned to. Revenue is hard-coded to 0 everywhere because no payment system
 * exists yet, and the monthly series are derived from the student total rather
 * than real history.
 */
export declare const getTutorAnalyticsService: (userId: string, userRole?: AdminRole) => Promise<{
    analytics: {
        revenue: {
            total: number;
            thisMonth: number;
            lastMonth: number;
            growth: number;
        };
        students: {
            total: number;
            enrollments: number;
            thisMonth: number;
            lastMonth: number;
            growth: number;
        };
        courses: {
            total: number;
            published: number;
            draft: number;
            archived: number;
        };
        engagement: {
            totalEnrollments: number;
            avgRating: number;
            totalReviews: number;
            completionRate: number;
        };
    };
    courseAnalytics: {
        id: string;
        title: string;
        students: number;
        revenue: number;
        rating: number;
        completionRate: number;
        materials: number;
        enrollments: {
            date: string;
            count: number;
        }[];
    }[];
    revenueData: {
        date: string;
        revenue: number;
        students: number;
    }[];
}>;
/**
 * Per-student completion for one course.
 *
 * Ownership is checked against `creatorId` for every caller — an Admin who did
 * not create the course gets the same "Course not found" as a stranger.
 */
export declare const getCourseCompletionService: (tutorId: string, courseId: string) => Promise<{
    courseId: string;
    courseName: string;
    totalMaterials: number;
    totalStudents: number;
    studentProgress: {
        studentId: string;
        studentName: string;
        completedMaterials: number;
        totalMaterials: number;
        completionRate: number;
    }[];
}>;
export {};
