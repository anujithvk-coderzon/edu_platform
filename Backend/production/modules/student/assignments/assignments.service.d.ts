import type { SubmitAssignmentInput } from "./assignments.validation";
export declare const listCourseAssignmentsService: (studentId: string, courseId: string) => Promise<{
    assignments: ({
        submissions: {
            id: string;
            status: import("../../../generated/prisma/enums").AssignmentStatus;
            score: number;
            submittedAt: Date;
            gradedAt: Date;
        }[];
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
    })[];
}>;
export declare const submitAssignmentService: (studentId: string, assignmentId: string, input: SubmitAssignmentInput) => Promise<{
    submission: {
        assignment: {
            title: string;
            dueDate: Date;
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
    progressUpdate: {
        progressPercentage: number;
        totalItems: number;
        completedItems: number;
    };
}>;
export declare const getSubmissionService: (studentId: string, assignmentId: string) => Promise<{
    submission: {
        assignment: {
            title: string;
            dueDate: Date;
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
export declare const uploadAssignmentFileService: (file: Express.Multer.File) => Promise<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    fileUrl: string;
}>;
