import { CourseStatus, MaterialType } from "../../../generated/prisma/client";
import type { AllCoursesQuery, CreateCourseInput, MyCoursesQuery, RejectCourseInput, ToggleTutorStatusInput, TutorsQuery, UpdateCourseInput } from "./courses.validation";
/**
 * Course management for the admin panel. Two callers share every endpoint:
 *
 *  - "Admin" sees and edits everything.
 *  - "Tutor" is limited to courses they created (`creatorId`) or were assigned
 *    (`tutorId`). That branching is what decides visibility, so it is carried
 *    over verbatim from the original handlers.
 */
type UserRole = string | undefined;
/** The caller fields `CreateCourse` needs for its tutorName fallback. */
export interface CourseCreator {
    id: string;
    firstName: string;
    lastName: string;
}
export declare const listAllCoursesService: (query: AllCoursesQuery) => Promise<{
    courses: {
        averageRating: number;
        _count: {
            materials: number;
            enrollments: number;
            reviews: number;
        };
        category: {
            id: string;
            name: string;
        };
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
        level: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string;
        title: string;
        thumbnail: string | null;
        duration: number | null;
        status: CourseStatus;
        isPublic: boolean;
        creatorId: string;
        tutorId: string | null;
        categoryId: string | null;
        tutorName: string | null;
        requirements: string[];
        prerequisites: string[];
        rejectionReason: string | null;
        rejectedAt: Date | null;
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}>;
export declare const listMyCoursesService: (query: MyCoursesQuery, userId: string, userRole: UserRole) => Promise<{
    courses: {
        averageRating: number;
        _count: {
            enrollments: number;
            materials: number;
            reviews: number;
        };
        category: {
            id: string;
            name: string;
        };
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        tutor: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        level: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string;
        title: string;
        thumbnail: string | null;
        duration: number | null;
        status: CourseStatus;
        isPublic: boolean;
        creatorId: string;
        tutorId: string | null;
        categoryId: string | null;
        tutorName: string | null;
        requirements: string[];
        prerequisites: string[];
        rejectionReason: string | null;
        rejectedAt: Date | null;
    }[];
    pagination: {
        total: number;
        pages: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}>;
export declare const listTutorsService: (query: TutorsQuery, userType: string | undefined, userRole: UserRole) => Promise<{
    tutors: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar: string;
        isActive: boolean;
        createdAt: Date;
        _count: {
            createdCourses: number;
        };
    }[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
    };
}>;
export declare const toggleTutorStatusService: (id: string, input: ToggleTutorStatusInput, userType: string | undefined, userRole: UserRole) => Promise<{
    tutor: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
    };
    message: string;
}>;
export declare const getCourseByIdService: (id: string, userId: string, userRole: UserRole) => Promise<{
    course: {
        averageRating: number;
        isEnrolled: boolean;
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
        category: {
            id: string;
            name: string;
        };
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
                type: MaterialType;
                description: string;
                title: string;
                isPublic: boolean;
                fileUrl: string;
                content: string;
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
        level: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string;
        title: string;
        thumbnail: string | null;
        duration: number | null;
        status: CourseStatus;
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
}>;
export declare const createCourseService: (input: CreateCourseInput, creator: CourseCreator) => Promise<{
    course: {
        category: {
            id: string;
            name: string;
        };
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
        tutor: {
            id: string;
            email: string;
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
        status: CourseStatus;
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
}>;
export declare const updateCourseService: (id: string, input: UpdateCourseInput, userId: string, userRole: UserRole) => Promise<{
    course: {
        category: {
            id: string;
            name: string;
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
        status: CourseStatus;
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
}>;
/** Tutor submits course for admin review. */
export declare const submitCourseForReviewService: (id: string, userId: string) => Promise<{
    course: {
        category: {
            id: string;
            name: string;
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
        status: CourseStatus;
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
    message: string;
}>;
/** Admin-only: Publish course (approve). */
export declare const publishCourseService: (id: string, userRole: UserRole) => Promise<{
    course: {
        _count: {
            materials: number;
            enrollments: number;
            reviews: number;
        };
        category: {
            id: string;
            name: string;
        };
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
        tutor: {
            id: string;
            email: string;
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
        status: CourseStatus;
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
    message: string;
}>;
/** Admin-only: Reject course. */
export declare const rejectCourseService: (id: string, input: RejectCourseInput, userRole: UserRole) => Promise<{
    course: {
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
        tutor: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
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
        status: CourseStatus;
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
    message: string;
}>;
/** Admin-only: Get pending courses count. */
export declare const getPendingCoursesCountService: (userRole: UserRole) => Promise<{
    count: number;
}>;
/** Admin-only: Get all pending courses. */
export declare const listPendingCoursesService: (userRole: UserRole) => Promise<{
    courses: ({
        _count: {
            materials: number;
            enrollments: number;
            modules: number;
        };
        category: {
            id: string;
            name: string;
        };
        creator: {
            id: string;
            email: string;
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
        status: CourseStatus;
        isPublic: boolean;
        creatorId: string;
        tutorId: string | null;
        categoryId: string | null;
        tutorName: string | null;
        requirements: string[];
        prerequisites: string[];
        rejectionReason: string | null;
        rejectedAt: Date | null;
    })[];
}>;
export declare const deleteCourseService: (id: string, userId: string, userRole: UserRole) => Promise<{
    courseName: string;
    deletedMaterials: string;
    deletedSubmissions: string;
    thumbnailDeleted: string;
}>;
export declare const cleanupOrphanedCoursesService: () => Promise<{
    data: {
        summary: {
            totalFound: number;
            deleted: number;
            skipped: number;
        };
        details: any[];
    };
    message: string;
}>;
export {};
