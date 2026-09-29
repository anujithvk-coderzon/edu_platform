import type { RegisteredStudentsQuery, UpdateUserInput } from "./students.validation";
export declare const getStudentsCountService: () => Promise<{
    studentsCount: number;
}>;
export declare const listRegisteredStudentsService: (query: RegisteredStudentsQuery) => Promise<{
    students: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string;
        phone: string;
        dateOfBirth: string;
        gender: string;
        country: string;
        city: string;
        education: string;
        institution: string;
        occupation: string;
        company: string;
        isVerified: boolean;
        isActive: boolean;
        blocked: boolean;
        registeredAt: string;
        lastActive: string;
    }[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
    };
}>;
/** Dashboard counters for the Admin table (admins, not students). */
export declare const getUserStatsService: () => Promise<{
    stats: {
        totalUsers: number;
        totalAdmins: number;
        totalCourses: number;
        totalEnrollments: number;
    };
    recentUsers: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        createdAt: Date;
    }[];
}>;
/** Counters for the Student table, with progress averaged over enrolments. */
export declare const getStudentStatsService: () => Promise<{
    stats: {
        totalStudents: number;
        activeStudents: number;
        newThisMonth: number;
        averageProgress: number;
        totalRevenue: number;
    };
}>;
type AdminSummary = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
};
type CompletedMaterialEntry = {
    id: string;
    title: string;
    type: string;
    completedAt: string;
    chapter: {
        id: string;
        title: string;
        orderIndex: number;
    } | null;
};
type SubmittedAssignmentEntry = {
    id: string;
    assignmentId: string;
    title: string;
    submittedAt: string;
    status: string;
    score: number | null;
    maxScore: number;
};
type EnrollmentSummary = {
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    status: string;
    progressPercentage: number;
    totalMaterials: number;
    totalAssignments: number;
    completedMaterials: number;
    submittedAssignments: number;
    gradedAssignments: number;
    completedMaterialsList: CompletedMaterialEntry[];
    submittedAssignmentsList: SubmittedAssignmentEntry[];
    creator: AdminSummary | null;
    tutor: AdminSummary | null;
};
type StudentSummary = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    isVerified: boolean;
    isActive: boolean;
    blocked: boolean;
    joinedAt: string;
    lastActive: string;
    enrollments: EnrollmentSummary[];
    totalCourses: number;
    completedCourses: number;
    totalSpentHours: number;
    totalMaterials: number;
    completedMaterials: number;
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
};
/**
 * The admin "Students" screen: every student of every course the caller can
 * see, with per-enrolment material and assignment detail.
 *
 * Admins see all courses; tutors see only courses they created or are
 * assigned to.
 */
export declare const getAllStudentsService: (adminId: string, userRole: string | undefined) => Promise<{
    students: StudentSummary[];
    stats: {
        totalStudents: number;
        activeStudents: number;
        newThisMonth: number;
        averageProgress: number;
        topPerformers: number;
        totalRevenue: number;
    };
}>;
/** `:id` here is an Admin record id — the route name is historical. */
export declare const getUserByIdService: (id: string) => Promise<{
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        avatar: string;
        isVerified: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            createdCourses: number;
            materials: number;
            assignments: number;
        };
    };
}>;
export declare const updateUserService: (id: string, input: UpdateUserInput) => Promise<{
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        avatar: string;
        isVerified: boolean;
        isActive: boolean;
        updatedAt: Date;
    };
}>;
export declare const deleteUserService: (id: string, callerId: string) => Promise<void>;
export declare const blockStudentService: (studentId: string, adminId: string, userRole: string | undefined) => Promise<{
    data: {
        student: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            blocked: boolean;
        };
    };
    message: string;
}>;
export declare const unblockStudentService: (studentId: string, adminId: string, userRole: string | undefined) => Promise<{
    data: {
        student: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            blocked: boolean;
        };
    };
    message: string;
}>;
export {};
