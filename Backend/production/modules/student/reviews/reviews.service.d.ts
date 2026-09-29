import type { ReviewQuery, SubmitReviewInput } from "./reviews.validation";
export declare const submitReviewService: (studentId: string, input: SubmitReviewInput) => Promise<{
    review: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rating: number;
        comment: string | null;
        courseId: string;
        studentId: string;
    };
}>;
export declare const listCourseReviewsService: (courseId: string, query: ReviewQuery) => Promise<{
    reviews: ({
        student: {
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rating: number;
        comment: string | null;
        courseId: string;
        studentId: string;
    })[];
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
    };
}>;
export declare const getMyReviewService: (studentId: string, courseId: string) => Promise<{
    review: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rating: number;
        comment: string | null;
        courseId: string;
        studentId: string;
    };
}>;
