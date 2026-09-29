import type { CreateAssignmentInput, GradeSubmissionInput, UpdateAssignmentInput } from "./assignments.validation";
/** The staff member performing the action: an Admin or a Tutor. */
export interface Caller {
    id: string;
    role?: "Admin" | "Tutor";
}
export declare const createAssignmentService: (caller: Caller, input: CreateAssignmentInput) => Promise<{
    assignment: {
        course: {
            id: string;
            title: string;
        };
        creator: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        creatorId: string;
        courseId: string;
        dueDate: Date | null;
        maxScore: number;
    };
}>;
export declare const getCourseAssignmentsService: (caller: Caller, courseId: string) => Promise<{
    assignments: {
        ungradedSubmissions: number;
        _count: {
            submissions: number;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        creatorId: string;
        courseId: string;
        dueDate: Date | null;
        maxScore: number;
    }[];
}>;
export declare const getAssignmentByIdService: (caller: Caller, id: string) => Promise<{
    assignment: {
        _count: {
            submissions: number;
        };
        course: {
            id: string;
            title: string;
        };
        creator: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        creatorId: string;
        courseId: string;
        dueDate: Date | null;
        maxScore: number;
    };
}>;
export declare const updateAssignmentService: (caller: Caller, id: string, input: UpdateAssignmentInput) => Promise<{
    assignment: {
        course: {
            id: string;
            title: string;
        };
        creator: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        creatorId: string;
        courseId: string;
        dueDate: Date | null;
        maxScore: number;
    };
}>;
export declare const deleteAssignmentService: (caller: Caller, id: string) => Promise<{
    deletedFilesCount: number;
}>;
export declare const getAssignmentSubmissionsService: (caller: Caller, assignmentId: string) => Promise<{
    submissions: ({
        student: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        assignment: {
            title: string;
            maxScore: number;
        };
    } & {
        id: string;
        status: import("../../../generated/prisma/enums").AssignmentStatus;
        studentId: string;
        fileUrl: string | null;
        content: string;
        score: number | null;
        feedback: string | null;
        assignmentId: string;
        submittedAt: Date;
        gradedAt: Date | null;
    })[];
}>;
export declare const gradeSubmissionService: (caller: Caller, submissionId: string, input: GradeSubmissionInput) => Promise<{
    submission: {
        student: {
            email: string;
            firstName: string;
            lastName: string;
        };
        assignment: {
            title: string;
            maxScore: number;
        };
    } & {
        id: string;
        status: import("../../../generated/prisma/enums").AssignmentStatus;
        studentId: string;
        fileUrl: string | null;
        content: string;
        score: number | null;
        feedback: string | null;
        assignmentId: string;
        submittedAt: Date;
        gradedAt: Date | null;
    };
}>;
