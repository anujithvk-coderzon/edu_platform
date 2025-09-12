import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { deleteUploadedFile } from '../utils/fileUtils';

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store all files directly in uploads directory
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    const sanitizedBaseName = baseName
      .replace(/[^a-zA-Z0-9\-_]/g, '_')
      .substring(0, 50);
    
    cb(null, `${sanitizedBaseName}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'text/plain',
    'application/json'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5
  }
});

router.post('/single', upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No file uploaded' }
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      path: req.file.path
    }
  });
}));

router.post('/multiple', upload.array('files', 5), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'No files uploaded' }
    });
  }
  
  const uploadedFiles = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: `/uploads/${file.filename}`,
    path: file.path
  }));

  res.json({
    success: true,
    data: { files: uploadedFiles }
  });
}));

router.post('/avatar', upload.single('avatar'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No avatar file uploaded' }
    });
  }

  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({
      success: false,
      error: { message: 'Avatar must be an image file' }
    });
  }

  const avatarUrl = `/uploads/${req.file.filename}`;

  // Get current user to check for existing avatar
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { avatar: true }
  });

  // Delete old avatar if it exists
  if (currentUser?.avatar) {
    deleteUploadedFile(currentUser.avatar);
  }

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { avatar: avatarUrl }
  });

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      url: avatarUrl,
      message: 'Avatar updated successfully'
    }
  });
}));

router.post('/course-thumbnail', upload.single('thumbnail'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No thumbnail file uploaded' }
    });
  }

  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({
      success: false,
      error: { message: 'Thumbnail must be an image file' }
    });
  }

  const { courseId } = req.body;

  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    if (course.creatorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to update this course' }
      });
    }

    const thumbnailUrl = `/uploads/${req.file.filename}`;

    // Get current course to check for existing thumbnail
    const currentCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { thumbnail: true }
    });

    // Delete old thumbnail if it exists
    if (currentCourse?.thumbnail) {
      deleteUploadedFile(currentCourse.thumbnail);
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { thumbnail: thumbnailUrl }
    });

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: thumbnailUrl,
        message: 'Course thumbnail updated successfully'
      }
    });
  } else {
    const thumbnailUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: thumbnailUrl
      }
    });
  }
}));

router.post('/material', upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No material file uploaded' }
    });
  }

  const { courseId, materialId, type } = req.body;
  
  // Store URL directly in uploads directory
  const fileUrl = `/uploads/${req.file.filename}`;

  // If courseId is provided, verify user has access
  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    if (course.creatorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to upload materials for this course' }
      });
    }
  }

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fileUrl: fileUrl,
      url: fileUrl,
      path: req.file.path
    }
  });
}));

router.delete('/file/:filename', asyncHandler(async (req: AuthRequest, res) => {
  const { filename } = req.params;

  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: { message: 'File not found' }
    });
  }

  try {
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete file' }
    });
  }
}));

router.get('/file-info/:filename', asyncHandler(async (req: AuthRequest, res) => {
  const { filename } = req.params;

  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: { message: 'File not found' }
    });
  }

  const stats = fs.statSync(filePath);
  const extension = path.extname(filename);

  res.json({
    success: true,
    data: {
      filename,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      extension,
      url: `/uploads/${filename}`
    }
  });
}));

export default router;