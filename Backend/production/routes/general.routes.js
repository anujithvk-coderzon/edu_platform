"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_validator_1 = require("express-validator");
// Import prisma and middleware
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
// ===== ADMIN REGISTRATION ROUTE (for creating admin through Postman) =====
router.post('/auth/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { email, password, firstName, lastName } = req.body;
    // Check if admin already exists with this email
    const existingAdmin = await DB_Config_1.default.admin.findUnique({
        where: { email }
    });
    if (existingAdmin) {
        return res.status(400).json({
            success: false,
            error: { message: 'Admin already exists with this email' }
        });
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const admin = await DB_Config_1.default.admin.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            isVerified: true, // Auto-verify admin accounts created through API
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isVerified: true,
            createdAt: true
        }
    });
    res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: {
            user: admin
        }
    });
}));
exports.default = router;
