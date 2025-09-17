"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ quiet: true });
const express_1 = __importDefault(require("express"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const general_routes_1 = __importDefault(require("./routes/general.routes"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const port = process.env.PORT || 4000;
const app = (0, express_1.default)();
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
    // Additional security headers to prevent downloads (non-PDFs)
    if (ext !== '.pdf') {
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
    }
    if (ext === '.mp4') {
        res.header("Content-Type", "video/mp4");
    }
    else if (ext === '.webm') {
        res.header("Content-Type", "video/webm");
    }
    else if (ext === '.mp3') {
        res.header("Content-Type", "audio/mpeg");
    }
    else if (ext === '.jpg' || ext === '.jpeg') {
        res.header("Content-Type", "image/jpeg");
    }
    else if (ext === '.png') {
        res.header("Content-Type", "image/png");
    }
    else if (ext === '.doc') {
        res.header("Content-Type", "application/msword");
    }
    else if (ext === '.docx') {
        res.header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }
    else if (ext === '.txt') {
        res.header("Content-Type", "text/plain");
    }
    next();
}, express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    credentials: true
}));
// Student routes (for student app)
app.use('/api/student', student_routes_1.default);
// Admin routes (for tutor app)
app.use('/api/admin', admin_routes_1.default);
// General routes (for creating admin via Postman)
app.use('/api', general_routes_1.default);
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
// Error handler - must be last
app.use((err, req, res, next) => {
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
});
