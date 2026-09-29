export declare const getPlatformStatsService: () => Promise<{
    totalCourses: number;
    totalStudents: number;
    totalEnrollments: number;
    averageRating: number;
    totalReviews: number;
    recentActivity: number;
    lastUpdated: string;
}>;
