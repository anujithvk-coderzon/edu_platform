"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionCookieOptions = exports.verifyStudentToken = exports.generateAdminToken = exports.generateStudentToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Session JWTs.
 *
 * `sessionToken` carries the single-active-session id: authMiddleware compares
 * it against `student.activeSessionToken`, so issuing a new one logs the
 * previous device out.
 */
const generateStudentToken = (studentId, sessionToken) => jsonwebtoken_1.default.sign({ id: studentId, type: "student", sessionToken }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
exports.generateStudentToken = generateStudentToken;
/** Admin/tutor session token. Staff sessions are not single-device. */
const generateAdminToken = (userId, type = "admin") => jsonwebtoken_1.default.sign({ id: userId, type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
});
exports.generateAdminToken = generateAdminToken;
/** Verify a student session JWT. Returns null instead of throwing. */
const verifyStudentToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return decoded?.type === "student" ? decoded : null;
    }
    catch {
        return null;
    }
};
exports.verifyStudentToken = verifyStudentToken;
/** Cookie options for the session cookie, matching existing behaviour. */
const sessionCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
};
exports.sessionCookieOptions = sessionCookieOptions;
