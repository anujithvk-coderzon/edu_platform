import { Response } from "express";
import { AuthRequest } from "../middleware/middleware";
export declare const EnrollInCourse: (req: AuthRequest, res: Response) => Promise<void>;
export declare const GetMyEnrollments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const GetCourseStudents: (req: AuthRequest, res: Response) => Promise<void>;
export declare const UpdateEnrollmentStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const GetEnrollmentProgress: (req: AuthRequest, res: Response) => Promise<void>;
export declare const DeleteEnrollment: (req: AuthRequest, res: Response) => Promise<void>;
