import type { Request, Response } from "express";
export declare const pdfPreflight: (_req: Request, res: Response) => Response<any, Record<string, any>>;
export declare const proxyPdf: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
