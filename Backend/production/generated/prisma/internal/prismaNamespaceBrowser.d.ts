import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models';
export type * from './prismaNamespace';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly Admin: "Admin";
    readonly Student: "Student";
    readonly Course: "Course";
    readonly Category: "Category";
    readonly CourseModule: "CourseModule";
    readonly Material: "Material";
    readonly Enrollment: "Enrollment";
    readonly Progress: "Progress";
    readonly Assignment: "Assignment";
    readonly AssignmentSubmission: "AssignmentSubmission";
    readonly TutorRequest: "TutorRequest";
    readonly Review: "Review";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const AdminScalarFieldEnum: {
    readonly id: "id";
    readonly email: "email";
    readonly password: "password";
    readonly firstName: "firstName";
    readonly lastName: "lastName";
    readonly role: "role";
    readonly avatar: "avatar";
    readonly isVerified: "isVerified";
    readonly isActive: "isActive";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type AdminScalarFieldEnum = (typeof AdminScalarFieldEnum)[keyof typeof AdminScalarFieldEnum];
export declare const StudentScalarFieldEnum: {
    readonly id: "id";
    readonly email: "email";
    readonly password: "password";
    readonly firstName: "firstName";
    readonly lastName: "lastName";
    readonly avatar: "avatar";
    readonly phone: "phone";
    readonly dateOfBirth: "dateOfBirth";
    readonly gender: "gender";
    readonly country: "country";
    readonly city: "city";
    readonly education: "education";
    readonly institution: "institution";
    readonly occupation: "occupation";
    readonly company: "company";
    readonly isVerified: "isVerified";
    readonly isActive: "isActive";
    readonly blocked: "blocked";
    readonly activeSessionToken: "activeSessionToken";
    readonly lastLoginAt: "lastLoginAt";
    readonly lastLoginIP: "lastLoginIP";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type StudentScalarFieldEnum = (typeof StudentScalarFieldEnum)[keyof typeof StudentScalarFieldEnum];
export declare const CourseScalarFieldEnum: {
    readonly id: "id";
    readonly title: "title";
    readonly description: "description";
    readonly thumbnail: "thumbnail";
    readonly price: "price";
    readonly duration: "duration";
    readonly level: "level";
    readonly status: "status";
    readonly isPublic: "isPublic";
    readonly creatorId: "creatorId";
    readonly tutorId: "tutorId";
    readonly categoryId: "categoryId";
    readonly tutorName: "tutorName";
    readonly requirements: "requirements";
    readonly prerequisites: "prerequisites";
    readonly rejectionReason: "rejectionReason";
    readonly rejectedAt: "rejectedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type CourseScalarFieldEnum = (typeof CourseScalarFieldEnum)[keyof typeof CourseScalarFieldEnum];
export declare const CategoryScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly description: "description";
    readonly createdAt: "createdAt";
};
export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum];
export declare const CourseModuleScalarFieldEnum: {
    readonly id: "id";
    readonly title: "title";
    readonly description: "description";
    readonly orderIndex: "orderIndex";
    readonly courseId: "courseId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type CourseModuleScalarFieldEnum = (typeof CourseModuleScalarFieldEnum)[keyof typeof CourseModuleScalarFieldEnum];
export declare const MaterialScalarFieldEnum: {
    readonly id: "id";
    readonly title: "title";
    readonly description: "description";
    readonly type: "type";
    readonly fileUrl: "fileUrl";
    readonly content: "content";
    readonly orderIndex: "orderIndex";
    readonly isPublic: "isPublic";
    readonly courseId: "courseId";
    readonly moduleId: "moduleId";
    readonly authorId: "authorId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type MaterialScalarFieldEnum = (typeof MaterialScalarFieldEnum)[keyof typeof MaterialScalarFieldEnum];
export declare const EnrollmentScalarFieldEnum: {
    readonly id: "id";
    readonly studentId: "studentId";
    readonly courseId: "courseId";
    readonly status: "status";
    readonly enrolledAt: "enrolledAt";
    readonly completedAt: "completedAt";
    readonly progressPercentage: "progressPercentage";
    readonly completedMaterials: "completedMaterials";
    readonly totalTimeSpent: "totalTimeSpent";
    readonly hasNewContent: "hasNewContent";
};
export type EnrollmentScalarFieldEnum = (typeof EnrollmentScalarFieldEnum)[keyof typeof EnrollmentScalarFieldEnum];
export declare const ProgressScalarFieldEnum: {
    readonly id: "id";
    readonly studentId: "studentId";
    readonly courseId: "courseId";
    readonly materialId: "materialId";
    readonly isCompleted: "isCompleted";
    readonly timeSpent: "timeSpent";
    readonly lastAccessed: "lastAccessed";
    readonly createdAt: "createdAt";
};
export type ProgressScalarFieldEnum = (typeof ProgressScalarFieldEnum)[keyof typeof ProgressScalarFieldEnum];
export declare const AssignmentScalarFieldEnum: {
    readonly id: "id";
    readonly title: "title";
    readonly description: "description";
    readonly dueDate: "dueDate";
    readonly maxScore: "maxScore";
    readonly courseId: "courseId";
    readonly creatorId: "creatorId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type AssignmentScalarFieldEnum = (typeof AssignmentScalarFieldEnum)[keyof typeof AssignmentScalarFieldEnum];
export declare const AssignmentSubmissionScalarFieldEnum: {
    readonly id: "id";
    readonly content: "content";
    readonly fileUrl: "fileUrl";
    readonly status: "status";
    readonly score: "score";
    readonly feedback: "feedback";
    readonly assignmentId: "assignmentId";
    readonly studentId: "studentId";
    readonly submittedAt: "submittedAt";
    readonly gradedAt: "gradedAt";
};
export type AssignmentSubmissionScalarFieldEnum = (typeof AssignmentSubmissionScalarFieldEnum)[keyof typeof AssignmentSubmissionScalarFieldEnum];
export declare const TutorRequestScalarFieldEnum: {
    readonly id: "id";
    readonly email: "email";
    readonly password: "password";
    readonly firstName: "firstName";
    readonly lastName: "lastName";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type TutorRequestScalarFieldEnum = (typeof TutorRequestScalarFieldEnum)[keyof typeof TutorRequestScalarFieldEnum];
export declare const ReviewScalarFieldEnum: {
    readonly id: "id";
    readonly rating: "rating";
    readonly comment: "comment";
    readonly courseId: "courseId";
    readonly studentId: "studentId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type ReviewScalarFieldEnum = (typeof ReviewScalarFieldEnum)[keyof typeof ReviewScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
