import express from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const BootstrapAdmin: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const RegisterUser: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const RegisterTutor: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const LoginUser: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const LogoutUser: (req: AuthRequest, res: express.Response) => express.Response<any, Record<string, any>>;
export declare const AdminForgotPassword: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const AdminVerifyForgotPasswordOtp: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const AdminResetPassword: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetCurrentUser: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UpdateProfile: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const ChangePassword: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetAllUsers: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetUserById: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UpdateUser: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const DeleteUser: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetUserStats: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetAllCourses: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetMyCourses: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetAllTutors: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetCourseById: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const CreateCourse: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UpdateCourse: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const PublishCourse: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const DeleteCourse: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetAllCategories: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetCategoryById: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const CreateCategory: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UpdateCategory: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const DeleteCategory: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetCourseModules: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetModuleById: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const CreateModule: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UpdateModule: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const DeleteModule: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const ReorderModule: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetCourseMaterials: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetMaterialById: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const CreateMaterial: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UpdateMaterial: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const DeleteMaterial: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const CompleteMaterial: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const EnrollInCourse: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetMyEnrollments: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetCourseStudents: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UpdateEnrollmentStatus: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetEnrollmentProgress: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const DeleteEnrollment: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UploadSingleFile: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UploadMultipleFiles: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UploadAvatar: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UploadCourseThumbnail: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const UploadMaterial: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const DeleteUploadedFile: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetFileInfo: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetTutorAnalytics: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const GetCourseCompletion: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Get assignments for enrolled course (student view)
 */
export declare const GetStudentCourseAssignments: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Submit assignment (student)
 */
export declare const SubmitAssignment: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Get assignment submission (student view)
 */
export declare const GetStudentSubmission: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Upload assignment file (student)
 */
export declare const UploadAssignmentFile: (req: AuthRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
