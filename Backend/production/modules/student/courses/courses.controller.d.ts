import type { Request, Response } from "express";
export declare const listCourses: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listCategories: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCourseById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
