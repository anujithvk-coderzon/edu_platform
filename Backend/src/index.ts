import { config } from 'dotenv';
config({ quiet: true });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import categoryRoutes from './routes/categories';
import moduleRoutes from './routes/modules';
import materialRoutes from './routes/materials';
import enrollmentRoutes from './routes/enrollments';
import uploadRoutes from './routes/uploads';
import analyticsRoutes from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

const app = express();
const port = process.env.PORT || 4000;

export const prisma = new PrismaClient();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files statically - uploads folder is in project root
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  setHeaders: (res, path) => {
    // Enable CORS for all files
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set appropriate content types for video files
    if (path.endsWith('.mp4')) {
      res.header('Content-Type', 'video/mp4');
    } else if (path.endsWith('.webm')) {
      res.header('Content-Type', 'video/webm');
    } else if (path.endsWith('.mov')) {
      res.header('Content-Type', 'video/quicktime');
    }
    
    // Enable partial content requests for video streaming
    res.header('Accept-Ranges', 'bytes');
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/modules', authMiddleware, moduleRoutes);
app.use('/api/materials', authMiddleware, materialRoutes);
app.use('/api/enrollments', authMiddleware, enrollmentRoutes);
app.use('/api/uploads', authMiddleware, uploadRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`🚀 CoderZon Education Platform API running on http://localhost:${port}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});