import type { NextFunction, Request, Response } from "express";
/**
 * Central error handler. Controllers throw; Express 5 forwards rejected
 * promises here automatically, so handlers need no try/catch of their own.
 *
 * The `{ success, error: { message } }` envelope is API contract — both
 * frontends branch on `success` and render `error.message` — so it is kept
 * byte-identical to what the previous handlers produced.
 */
export declare const errorHandler: (err: any, req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
