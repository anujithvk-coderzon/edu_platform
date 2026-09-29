import type { Request, Response } from "express";
/** Public: platform-wide counters shown on the landing page. */
export declare const getPlatformStats: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
