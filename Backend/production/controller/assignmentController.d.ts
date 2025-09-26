import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Create a new assignment
 */
export declare const CreateAssignment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get assignments for a course
 */
export declare const GetCourseAssignments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get assignment by ID
 */
export declare const GetAssignmentById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Update assignment
 */
export declare const UpdateAssignment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Delete assignment
 */
export declare const DeleteAssignment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get assignment submissions
 */
export declare const GetAssignmentSubmissions: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Grade assignment submission
 */
export declare const GradeSubmission: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get assignments for enrolled course (student view)
 */
export declare const GetStudentCourseAssignments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Submit assignment (student)
 */
export declare const SubmitAssignment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get assignment submission (student view)
 */
export declare const GetStudentSubmission: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
