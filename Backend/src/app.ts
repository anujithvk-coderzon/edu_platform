import express, { Request, Response, NextFunction } from 'express'
import studentRoutes from "./modules/student/student.routes";
import adminRoutes from "./modules/admin/admin.routes";
import cors from 'cors'
import path from 'path'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import { normalizeMediaPaths, resolveMediaUrls } from './middlewares/mediaUrls'
import { errorHandler } from './middlewares/errorHandler'
const app = express()

const isProduction = process.env.NODE_ENV === "production"

// Serve static files with CORS headers and proper content types
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");

  // Prevent downloading - force inline display
  res.header("Content-Disposition", "inline");
  res.header("X-Content-Type-Options", "nosniff");

  // Set proper content types
  const ext = path.extname(req.path).toLowerCase();
  if (ext === '.pdf') {
    res.header("Content-Type", "application/pdf");
    // Force inline viewing, not download
    res.header("Content-Disposition", "inline");
    // Allow PDF embedding in iframes by not setting X-Frame-Options
  } else {
    // Disable right-click context menu for downloads (non-PDFs)
    res.header("X-Frame-Options", "SAMEORIGIN");
  }

  // Set proper content types and caching
  if (ext === '.mp4') {
    res.header("Content-Type", "video/mp4");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
  } else if (ext === '.webm') {
    res.header("Content-Type", "video/webm");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
  } else if (ext === '.mp3') {
    res.header("Content-Type", "audio/mpeg");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.header("Content-Type", "image/jpeg");
    // Allow caching for images (thumbnails)
    res.header("Cache-Control", "public, max-age=3600");
  } else if (ext === '.png') {
    res.header("Content-Type", "image/png");
    // Allow caching for images (thumbnails)
    res.header("Cache-Control", "public, max-age=3600");
  } else if (ext === '.gif') {
    res.header("Content-Type", "image/gif");
    // Allow caching for images (thumbnails)
    res.header("Cache-Control", "public, max-age=3600");
  } else if (ext === '.webp') {
    res.header("Content-Type", "image/webp");
    // Allow caching for images (thumbnails)
    res.header("Cache-Control", "public, max-age=3600");
  } else if (ext === '.doc') {
    res.header("Content-Type", "application/msword");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
  } else if (ext === '.docx') {
    res.header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
  } else if (ext === '.txt') {
    res.header("Content-Type", "text/plain");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
  }

  next();
}, express.static(path.join(__dirname, "../uploads")));
// Media is served to the frontends on other origins, so CORP must stay
// cross-origin; the default would block thumbnails and PDFs.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(morgan('tiny'))
app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ extended: true, limit: '200mb' }))
app.use(cookieParser())

// Media paths are stored relative and served absolute; translate at the boundary
// so controllers never deal with CDN hosts and clients never need CDN config.
app.use(normalizeMediaPaths)
app.use(resolveMediaUrls)

// Increase server timeout for large file uploads (5 minutes)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Only apply extended timeout for upload endpoints
  if (req.path.includes('/uploads/')) {
    req.setTimeout(300000); // 5 minutes
    res.setTimeout(300000); // 5 minutes
  }
  next();
});
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://192.168.32.1:3000',
    'https://student-omega-liart.vercel.app',  // Student app URL
    'https://edu-platform-gamma-two.vercel.app',  // Admin app URL
  // Extra origins for a given environment, comma separated.
  ...(process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
]

// Testing on a real phone means the browser's origin is the laptop's LAN IP
// with a port, not localhost. Allow private address ranges in development
// only, so this never widens the allowlist in production.
const PRIVATE_LAN_ORIGIN =
  /^http:\/\/(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)[\d.]+(?::\d+)?$/

const isOriginAllowed = (origin: string): boolean =>
  allowedOrigins.includes(origin) ||
  (!isProduction && PRIVATE_LAN_ORIGIN.test(origin))

app.use(cors({
  origin: (origin, callback) => {
    // No Origin header: same-origin navigations, curl, native apps.
    if (!origin) return callback(null, true)
    if (isOriginAllowed(origin)) return callback(null, true)
    callback(new Error(`Origin not allowed by CORS: ${origin}`))
  },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

// Student routes (for student app)
app.use('/api/student', studentRoutes)

// Admin routes (for tutor app)
app.use('/api/admin', adminRoutes)

// 404 handler - must be after all routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'API endpoint not found',
      path: req.path,
      method: req.method
    }
  });
});

// Error handler - must be last.
// Handles AppError (statusCode), ZodError, MulterError, Prisma errors, and
// legacy plain errors carrying `status`/`statusCode`.
app.use(errorHandler);

export default app;
