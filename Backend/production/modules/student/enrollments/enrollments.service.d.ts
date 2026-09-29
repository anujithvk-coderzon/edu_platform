import type { EnrollmentQuery } from "./enrollments.validation";
export declare const listMyEnrollmentsService: (studentId: string, query: EnrollmentQuery) => Promise<{
    enrollments: {
        hasReviewed: boolean;
        totalTimeSpent: number;
        completedMaterials: number;
        course: {
            averageRating: number;
            level: string;
            id: string;
            _count: {
                materials: number;
                enrollments: number;
                reviews: number;
            };
            price: number;
            description: string;
            title: string;
            thumbnail: string;
            duration: number;
            tutorName: string;
            creator: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string;
            };
        };
        id: string;
        status: import("../../../generated/prisma/enums").EnrollmentStatus;
        progressPercentage: number;
        hasNewContent: boolean;
        enrolledAt: Date;
        completedAt: Date;
    }[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}>;
export declare const enrollInCourseService: (studentId: string, courseId: string) => Promise<{
    enrollment: {
        course: {
            id: string;
            title: string;
            thumbnail: string;
        };
    } & {
        id: string;
        status: import("../../../generated/prisma/enums").EnrollmentStatus;
        courseId: string;
        studentId: string;
        progressPercentage: number;
        hasNewContent: boolean;
        enrolledAt: Date;
        completedAt: Date | null;
        completedMaterials: number;
        totalTimeSpent: number;
    };
}>;
export declare const getEnrollmentProgressService: (studentId: string, courseId: string) => Promise<{
    enrollment: {
        progressPercentage: number;
        id: string;
        status: import("../../../generated/prisma/enums").EnrollmentStatus;
        courseId: string;
        studentId: string;
        hasNewContent: boolean;
        enrolledAt: Date;
        completedAt: Date | null;
        completedMaterials: number;
        totalTimeSpent: number;
    };
    materials: {
        progress: {
            id: string;
            createdAt: Date;
            courseId: string;
            studentId: string;
            materialId: string | null;
            isCompleted: boolean;
            timeSpent: number;
            lastAccessed: Date;
        };
        id: string;
        type: import("../../../generated/prisma/enums").MaterialType;
        description: string;
        title: string;
        fileUrl: string;
        content: string;
        orderIndex: number;
        moduleId: string;
        module: {
            id: string;
            description: string;
            title: string;
            orderIndex: number;
        };
    }[];
    assignments: {
        submission: {
            id: string;
            status: import("../../../generated/prisma/enums").AssignmentStatus;
            score: number;
            feedback: string;
            assignmentId: string;
            submittedAt: Date;
        };
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        dueDate: Date;
        maxScore: number;
    }[];
    stats: {
        totalMaterials: number;
        completedMaterials: number;
        totalAssignments: number;
        submittedAssignments: number;
        progressPercentage: number;
        totalTimeSpent: number;
    };
}>;
