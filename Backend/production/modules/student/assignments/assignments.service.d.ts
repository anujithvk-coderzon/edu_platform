import type { SubmitAssignmentInput } from "./assignments.validation";
export declare const listCourseAssignmentsService: (studentId: string, courseId: string) => Promise<{
    assignments: {
        id: string;
        submissions: {
            id: string;
            status: import("../../../generated/prisma/enums").AssignmentStatus;
            score: number;
            submittedAt: Date;
            gradedAt: Date;
        }[];
        description: string;
        title: string;
        dueDate: Date;
        maxScore: number;
    }[];
}>;
export declare const submitAssignmentService: (studentId: string, assignmentId: string, input: SubmitAssignmentInput) => Promise<{
    submission: {
        id: string;
        status: import("../../../generated/prisma/enums").AssignmentStatus;
        fileUrl: string;
        content: string;
        assignment: {
            title: string;
            dueDate: Date;
            maxScore: number;
        };
        score: number;
        feedback: string;
        submittedAt: Date;
        gradedAt: Date;
    };
    progressUpdate: {
        progressPercentage: number;
        totalItems: number;
        completedItems: number;
    };
}>;
export declare const getSubmissionService: (studentId: string, assignmentId: string) => Promise<{
    submission: {
        id: string;
        status: import("../../../generated/prisma/enums").AssignmentStatus;
        fileUrl: string;
        content: string;
        assignment: {
            title: string;
            dueDate: Date;
            maxScore: number;
        };
        score: number;
        feedback: string;
        submittedAt: Date;
        gradedAt: Date;
    };
}>;
export declare const uploadAssignmentFileService: (file: Express.Multer.File) => Promise<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    fileUrl: string;
}>;
