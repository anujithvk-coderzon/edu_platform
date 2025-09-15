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

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
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

