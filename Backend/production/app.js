"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const student_routes_1 = __importDefault(require("./modules/student/student.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const mediaUrls_1 = require("./middlewares/mediaUrls");
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
const isProduction = process.env.NODE_ENV === "production";
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
    const ext = path_1.default.extname(req.path).toLowerCase();
    if (ext === '.pdf') {
        res.header("Content-Type", "application/pdf");
        // Force inline viewing, not download
        res.header("Content-Disposition", "inline");
        // Allow PDF embedding in iframes by not setting X-Frame-Options
    }
    else {
        // Disable right-click context menu for downloads (non-PDFs)
        res.header("X-Frame-Options", "SAMEORIGIN");
    }
    // Set proper content types and caching
    if (ext === '.mp4') {
        res.header("Content-Type", "video/mp4");
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
    }
    else if (ext === '.webm') {
        res.header("Content-Type", "video/webm");
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
    }
    else if (ext === '.mp3') {
        res.header("Content-Type", "audio/mpeg");
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
    }
    else if (ext === '.jpg' || ext === '.jpeg') {
        res.header("Content-Type", "image/jpeg");
        // Allow caching for images (thumbnails)
        res.header("Cache-Control", "public, max-age=3600");
    }
    else if (ext === '.png') {
        res.header("Content-Type", "image/png");
        // Allow caching for images (thumbnails)
        res.header("Cache-Control", "public, max-age=3600");
    }
    else if (ext === '.gif') {
        res.header("Content-Type", "image/gif");
        // Allow caching for images (thumbnails)
        res.header("Cache-Control", "public, max-age=3600");
    }
    else if (ext === '.webp') {
        res.header("Content-Type", "image/webp");
        // Allow caching for images (thumbnails)
        res.header("Cache-Control", "public, max-age=3600");
    }
    else if (ext === '.doc') {
        res.header("Content-Type", "application/msword");
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
    }
    else if (ext === '.docx') {
        res.header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
    }
    else if (ext === '.txt') {
        res.header("Content-Type", "text/plain");
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
    }
    next();
}, express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// Media is served to the frontends on other origins, so CORP must stay
// cross-origin; the default would block thumbnails and PDFs.
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((0, morgan_1.default)('tiny'));
app.use(express_1.default.json({ limit: '200mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '200mb' }));
app.use((0, cookie_parser_1.default)());
// Media paths are stored relative and served absolute; translate at the boundary
// so controllers never deal with CDN hosts and clients never need CDN config.
app.use(mediaUrls_1.normalizeMediaPaths);
app.use(mediaUrls_1.resolveMediaUrls);
// Increase server timeout for large file uploads (5 minutes)
app.use((req, res, next) => {
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
    'https://student-omega-liart.vercel.app', // Student app URL
    'https://edu-platform-gamma-two.vercel.app', // Admin app URL
    // Extra origins for a given environment, comma separated.
    ...(process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
];
// Testing on a real phone means the browser's origin is the laptop's LAN IP
// with a port, not localhost. Allow private address ranges in development
// only, so this never widens the allowlist in production.
const PRIVATE_LAN_ORIGIN = /^http:\/\/(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)[\d.]+(?::\d+)?$/;
const isOriginAllowed = (origin) => allowedOrigins.includes(origin) ||
    (!isProduction && PRIVATE_LAN_ORIGIN.test(origin));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // No Origin header: same-origin navigations, curl, native apps.
        if (!origin)
            return callback(null, true);
        if (isOriginAllowed(origin))
            return callback(null, true);
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));
// Student routes (for student app)
app.use('/api/student', student_routes_1.default);
// Admin routes (for tutor app)
app.use('/api/admin', admin_routes_1.default);
// 404 handler - must be after all routes
app.use((req, res) => {
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
app.use(errorHandler_1.errorHandler);
exports.default = app;
