export declare const CourseStatus: {
    readonly DRAFT: "DRAFT";
    readonly PENDING_REVIEW: "PENDING_REVIEW";
    readonly PUBLISHED: "PUBLISHED";
    readonly ARCHIVED: "ARCHIVED";
    readonly REJECTED: "REJECTED";
};
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];
export declare const EnrollmentStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly COMPLETED: "COMPLETED";
    readonly DROPPED: "DROPPED";
};
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];
export declare const MaterialType: {
    readonly PDF: "PDF";
    readonly VIDEO: "VIDEO";
    readonly LINK: "LINK";
};
export type MaterialType = (typeof MaterialType)[keyof typeof MaterialType];
export declare const AssignmentStatus: {
    readonly PENDING: "PENDING";
    readonly SUBMITTED: "SUBMITTED";
    readonly GRADED: "GRADED";
};
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];
