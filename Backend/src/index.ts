import { config } from "dotenv";
config({quiet:true});
import express, { Request, Response, NextFunction } from 'express'
import route from "./routes/route";
import studentRoutes from "./routes/student.routes";
import adminRoutes from "./routes/admin.routes";
import generalRoutes from "./routes/general.routes";
import cors from 'cors'
import path from 'path'
import cookieParser from 'cookie-parser'
const port = process.env.PORT || 4000;
const app = express()

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

  // Additional security headers to prevent downloads (non-PDFs)
  if (ext !== '.pdf') {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
  }

  if (ext === '.mp4') {
    res.header("Content-Type", "video/mp4");
  } else if (ext === '.webm') {
    res.header("Content-Type", "video/webm");
  } else if (ext === '.mp3') {
    res.header("Content-Type", "audio/mpeg");
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.header("Content-Type", "image/jpeg");
  } else if (ext === '.png') {
    res.header("Content-Type", "image/png");
  } else if (ext === '.doc') {
    res.header("Content-Type", "application/msword");
  } else if (ext === '.docx') {
    res.header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  } else if (ext === '.txt') {
    res.header("Content-Type", "text/plain");
  }

  next();
}, express.static(path.join(__dirname, "../uploads")));
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"], 
  credentials: true
}))

// Student routes (for student app)
app.use('/api/student', studentRoutes)

// Admin routes (for tutor app)
app.use('/api/admin', adminRoutes)

// General routes (for creating admin via Postman)
app.use('/api', generalRoutes)

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

// Error handler - must be last
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

app.listen(port, () => {
    console.log(`🚀 Server listening at http://localhost:${port}`);
})

