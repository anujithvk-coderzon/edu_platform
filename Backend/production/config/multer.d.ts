import multer from 'multer';
import { Request } from 'express';
export declare const uploadImage: multer.Multer;
export declare const uploadVideo: multer.Multer;
export declare const uploadDocument: multer.Multer;
export declare const uploadThumbnail: multer.Multer;
export declare const uploadAny: multer.Multer;
export declare const deleteUploadedFile: (filePath: string) => Promise<void>;
export declare const getFileUrl: (req: Request, filePath: string) => string;
