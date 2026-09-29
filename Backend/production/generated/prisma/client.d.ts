import * as runtime from "@prisma/client/runtime/client";
import * as $Class from "./internal/class";
import * as Prisma from "./internal/prismaNamespace";
export * as $Enums from './enums';
export * from "./enums";
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Admins
 * const admins = await prisma.admin.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export declare const PrismaClient: $Class.PrismaClientConstructor;
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>;
export { Prisma };
/**
 * Model Admin
 *
 */
export type Admin = Prisma.AdminModel;
/**
 * Model Student
 *
 */
export type Student = Prisma.StudentModel;
/**
 * Model Course
 *
 */
export type Course = Prisma.CourseModel;
/**
 * Model Category
 *
 */
export type Category = Prisma.CategoryModel;
/**
 * Model CourseModule
 *
 */
export type CourseModule = Prisma.CourseModuleModel;
/**
 * Model Material
 *
 */
export type Material = Prisma.MaterialModel;
/**
 * Model Enrollment
 *
 */
export type Enrollment = Prisma.EnrollmentModel;
/**
 * Model Progress
 *
 */
export type Progress = Prisma.ProgressModel;
/**
 * Model Assignment
 *
 */
export type Assignment = Prisma.AssignmentModel;
/**
 * Model AssignmentSubmission
 *
 */
export type AssignmentSubmission = Prisma.AssignmentSubmissionModel;
/**
 * Model TutorRequest
 *
 */
export type TutorRequest = Prisma.TutorRequestModel;
/**
 * Model Review
 *
 */
export type Review = Prisma.ReviewModel;
