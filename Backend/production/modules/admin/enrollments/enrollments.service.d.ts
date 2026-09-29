import type { EnrollmentStatusValue } from "./enrollments.validation";
/** Admin role as carried on the token; `undefined` for student sessions. */
type CallerRole = "Admin" | "Tutor" | undefined;
export declare const enrollInCourseService: (studentId: string, courseId: string) => Promise<{
    enrollment: {
        course: {
            id: string;
            description: string;
            title: string;
            thumbnail: string;
            creator: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string;
            };
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
export declare const getMyEnrollmentsService: (studentId: string) => Promise<{
    enrollments: {
        completedMaterials: number;
        totalTimeSpent: number;
        course: {
            _count: {
                materials: number;
                reviews: number;
            };
            creator: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string;
            };
        } & {
            level: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            description: string;
            title: string;
            thumbnail: string | null;
            duration: number | null;
            status: import("../../../generated/prisma/enums").CourseStatus;
            isPublic: boolean;
            creatorId: string;
            tutorId: string | null;
            categoryId: string | null;
            tutorName: string | null;
            requirements: string[];
            prerequisites: string[];
            rejectionReason: string | null;
            rejectedAt: Date | null;
        };
        id: string;
        status: import("../../../generated/prisma/enums").EnrollmentStatus;
        courseId: string;
        studentId: string;
        progressPercentage: number;
        hasNewContent: boolean;
        enrolledAt: Date;
        completedAt: Date | null;
    }[];
}>;
export declare const getCourseStudentsService: (callerId: string, callerRole: CallerRole, courseId: string) => Promise<{
    students: {
        completedMaterials: number;
        totalTimeSpent: number;
        lastAccessed: Date;
        student: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
        id: string;
        status: import("../../../generated/prisma/enums").EnrollmentStatus;
        courseId: string;
        studentId: string;
        progressPercentage: number;
        hasNewContent: boolean;
        enrolledAt: Date;
        completedAt: Date | null;
    }[];
}>;
export declare const updateEnrollmentStatusService: (callerId: string, callerRole: CallerRole, enrollmentId: string, status: EnrollmentStatusValue) => Promise<{
    enrollment: {
        student: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
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
        title: string;
        orderIndex: number;
        moduleId: string;
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
export declare const deleteEnrollmentService: (callerId: string, callerRole: CallerRole, enrollmentId: string) => Promise<void>;
export {};
