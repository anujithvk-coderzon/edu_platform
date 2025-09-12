import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload directories exist
const uploadDirs = {
  images: path.join(__dirname, '../uploads/images'),
  videos: path.join(__dirname, '../uploads/videos'),
  documents: path.join(__dirname, '../uploads/documents'),
  thumbnails: path.join(__dirname, '../uploads/thumbnails'),
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter for different types
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const videoFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /mp4|avi|mov|wmv|flv|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /video/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'));
  }
};

const documentFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /pdf|doc|docx|txt|ppt|pptx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid document format!'));
  }
};

// Storage configuration
const createStorage = (type: 'images' | 'videos' | 'documents' | 'thumbnails') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirs[type]);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${uniqueSuffix}-${sanitizedFilename}`);
    }
  });
};

// Multer configurations for different file types
export const uploadImage = multer({
  storage: createStorage('images'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: imageFilter
});

export const uploadVideo = multer({
  storage: createStorage('videos'),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: videoFilter
});

export const uploadDocument = multer({
  storage: createStorage('documents'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: documentFilter
});

export const uploadThumbnail = multer({
  storage: createStorage('thumbnails'),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: imageFilter
});

// Generic upload for any file type
export const uploadAny = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Determine destination based on file type
      if (/image/.test(file.mimetype)) {
        cb(null, uploadDirs.images);
      } else if (/video/.test(file.mimetype)) {
        cb(null, uploadDirs.videos);
      } else {
        cb(null, uploadDirs.documents);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${uniqueSuffix}-${sanitizedFilename}`);
    }
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  }
});

// Helper function to delete uploaded files
export const deleteUploadedFile = async (filePath: string): Promise<void> => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`File deleted: ${fullPath}`);
    }
  } catch (error) {
    console.error(`Error deleting file: ${filePath}`, error);
  }
};

// Helper to get file URL
export const getFileUrl = (req: Request, filePath: string): string => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/${filePath}`;
};