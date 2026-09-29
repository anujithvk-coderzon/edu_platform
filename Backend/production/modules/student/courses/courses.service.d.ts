import type { CourseQuery } from "./courses.validation";
export declare const listCoursesService: (query: CourseQuery, studentId: string | null) => Promise<{
    courses: {
        averageRating: number;
        isEnrolled: boolean;
        enrollmentStatus: any;
        progressPercentage: any;
        hasReviewed: boolean;
        hasNewContent: any;
        level: string;
        id: string;
        createdAt: Date;
        _count: {
            materials: number;
            enrollments: number;
            reviews: number;
        };
        category: {
            id: string;
            name: string;
        };
        price: number;
        description: string;
        title: string;
        thumbnail: string;
        duration: number;
        status: import("../../../generated/prisma/enums").CourseStatus;
        isPublic: boolean;
        creatorId: string;
        tutorName: string;
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
        tutor: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}>;
export declare const listCategoriesService: () => Promise<{
    categories: ({
        _count: {
            courses: number;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
    })[];
}>;
export declare const getCourseByIdService: (courseId: string, studentId: string | null) => Promise<{
    course: {
        averageRating: number;
        totalReviews: number;
        isEnrolled: boolean;
        hasReviewed: boolean;
        enrollmentStatus: string;
        progressPercentage: number;
        level: string;
        id: string;
        _count: {
            materials: number;
            enrollments: number;
            reviews: number;
        };
        reviews: ({
            student: {
                id: string;
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
        price: number;
        description: string;
        title: string;
        thumbnail: string;
        duration: number;
        tutorName: string;
        requirements: string[];
        prerequisites: string[];
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
        tutor: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
        modules: ({
            materials: {
                id: string;
                type: import("../../../generated/prisma/enums").MaterialType;
                description: string;
                title: string;
                orderIndex: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            courseId: string;
            orderIndex: number;
        })[];
    };
}>;
