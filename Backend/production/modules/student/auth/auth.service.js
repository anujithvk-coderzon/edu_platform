"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordService = exports.updateProfileService = exports.getCurrentUserService = exports.resetPasswordService = exports.verifyForgotOtpService = exports.forgotPasswordService = exports.logoutService = exports.loginService = exports.oauthLoginService = exports.oauthRegisterService = exports.resendOtpService = exports.verifyRegistrationOtpService = exports.registerService = exports.verifyEmailOtpService = exports.sendEmailOtpService = exports.checkEmailService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const jwt_1 = require("../../../lib/jwt");
const firebase_1 = require("../../../lib/firebase");
const Errors_1 = require("../../../errors/Errors");
const email_1 = require("../../../lib/email");
/** Columns returned to the client for a student profile. */
const studentSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    dateOfBirth: true,
    gender: true,
    country: true,
    city: true,
    education: true,
    institution: true,
    occupation: true,
    company: true,
    avatar: true,
    isVerified: true,
    createdAt: true,
};
const BCRYPT_ROUNDS = 12;
/** Start a session: rotate the session token, stamp login metadata, sign a JWT. */
const startSession = async (studentId, clientIP) => {
    const sessionToken = (0, crypto_1.randomUUID)();
    await prisma_1.default.student.update({
        where: { id: studentId },
        data: {
            activeSessionToken: sessionToken,
            lastLoginAt: new Date(),
            lastLoginIP: clientIP,
        },
    });
    return { sessionToken, token: (0, jwt_1.generateStudentToken)(studentId, sessionToken) };
};
const assertEmailAvailable = async (email) => {
    const existing = await prisma_1.default.student.findUnique({ where: { email } });
    if (existing) {
        throw new Errors_1.BadRequestError("An account with this email already exists");
    }
};
/** Blocked/deactivated checks, in the same order the old handlers used. */
const assertLoginAllowed = (student) => {
    if (student.blocked) {
        throw new Errors_1.ForbiddenError("Your account has been blocked by the administrator. Please contact support for assistance.");
    }
    if (!student.isActive) {
        throw new Errors_1.ForbiddenError("Account is deactivated");
    }
};
const checkEmailService = async (email) => {
    await assertEmailAvailable(email);
    return { email, available: true };
};
exports.checkEmailService = checkEmailService;
const sendEmailOtpService = async (email) => {
    await assertEmailAvailable(email);
    const otp = (0, email_1.generateOTP)();
    (0, email_1.storeOTP)(email, otp, null);
    const result = await (0, email_1.sendVerificationEmail)(email, otp);
    if (!result.success) {
        throw new Errors_1.InternalServerError(result.error || "Failed to send verification email. Please try again.");
    }
    return { email };
};
exports.sendEmailOtpService = sendEmailOtpService;
const verifyEmailOtpService = (email, otp) => {
    const verification = (0, email_1.verifyOTP)(email, otp);
    if (!verification.valid) {
        throw new Errors_1.BadRequestError(verification.message || "Invalid or expired OTP. Please try again.");
    }
    return { email, verified: true };
};
exports.verifyEmailOtpService = verifyEmailOtpService;
/** Registration stores the pending account against the OTP; nothing is created yet. */
const registerService = async (input) => {
    await assertEmailAvailable(input.email);
    const otp = (0, email_1.generateOTP)();
    const hashedPassword = await bcryptjs_1.default.hash(input.password, BCRYPT_ROUNDS);
    (0, email_1.storeOTP)(input.email, otp, {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        gender: input.gender || null,
        country: input.country || null,
        city: input.city || null,
        education: input.education || null,
        institution: input.institution || null,
        occupation: input.occupation || null,
        company: input.company || null,
    });
    const result = await (0, email_1.sendVerificationEmail)(input.email, otp);
    if (!result.success) {
        throw new Errors_1.InternalServerError(result.error || "Failed to send verification email. Please try again.");
    }
    return { email: input.email };
};
exports.registerService = registerService;
/** Confirms the OTP and only then creates the account. */
const verifyRegistrationOtpService = async (email, otp, clientIP) => {
    const verification = (0, email_1.verifyOTP)(email, otp);
    if (!verification.valid) {
        throw new Errors_1.BadRequestError(verification.message || "Invalid or expired OTP. Please try again.");
    }
    const userData = verification.userData;
    const sessionToken = (0, crypto_1.randomUUID)();
    const student = await prisma_1.default.student.create({
        data: {
            ...userData,
            activeSessionToken: sessionToken,
            lastLoginAt: new Date(),
            lastLoginIP: clientIP,
        },
        select: studentSelect,
    });
    const token = (0, jwt_1.generateStudentToken)(student.id, sessionToken);
    // A failed welcome email must not fail the registration.
    try {
        await (0, email_1.StudentWelcomeEmail)(userData.email, userData.firstName);
    }
    catch (error) {
        console.error("⚠️ Welcome email error but registration continues:", error);
    }
    return { user: student, token };
};
exports.verifyRegistrationOtpService = verifyRegistrationOtpService;
const resendOtpService = async (email) => {
    const otp = (0, email_1.generateOTP)();
    const result = await (0, email_1.sendVerificationEmail)(email, otp);
    if (!result.success) {
        throw new Errors_1.InternalServerError(result.error || "Failed to send verification email. Please try again.");
    }
    return { email };
};
exports.resendOtpService = resendOtpService;
/**
 * OAuth registration. The email comes from the verified Firebase token, never
 * from the request — a client-supplied address would let anyone claim an
 * identity they do not own.
 */
const oauthRegisterService = async (input, clientIP) => {
    const identity = await (0, firebase_1.verifyFirebaseIdToken)(input.idToken);
    await assertEmailAvailable(identity.email);
    const sessionToken = (0, crypto_1.randomUUID)();
    const student = await prisma_1.default.student.create({
        data: {
            email: identity.email,
            password: null, // OAuth accounts have no password
            firstName: input.firstName,
            lastName: input.lastName,
            avatar: input.avatar || identity.picture || null,
            phone: input.phone || null,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
            gender: input.gender || null,
            country: input.country || null,
            city: input.city || null,
            education: input.education || null,
            institution: input.institution || null,
            occupation: input.occupation || null,
            company: input.company || null,
            isVerified: true, // the provider vouched for the address
            activeSessionToken: sessionToken,
            lastLoginAt: new Date(),
            lastLoginIP: clientIP,
        },
        select: studentSelect,
    });
    const token = (0, jwt_1.generateStudentToken)(student.id, sessionToken);
    try {
        await (0, email_1.StudentWelcomeEmail)(identity.email, input.firstName);
    }
    catch (error) {
        console.error("⚠️ Welcome email error but registration continues:", error);
    }
    return { user: student, token };
};
exports.oauthRegisterService = oauthRegisterService;
const oauthLoginService = async (idToken, clientIP) => {
    const identity = await (0, firebase_1.verifyFirebaseIdToken)(idToken);
    const student = await prisma_1.default.student.findUnique({
        where: { email: identity.email },
    });
    if (!student) {
        throw new Errors_1.NotFoundError("Account not found. Please register first.");
    }
    assertLoginAllowed(student);
    const { token } = await startSession(student.id, clientIP);
    const { password, activeSessionToken, ...rest } = student;
    return { user: { ...rest, hasPassword: !!password }, token };
};
exports.oauthLoginService = oauthLoginService;
const loginService = async (email, password, clientIP) => {
    const student = await prisma_1.default.student.findUnique({ where: { email } });
    if (!student) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    if (student.blocked) {
        throw new Errors_1.ForbiddenError("Your account has been blocked by the administrator. Please contact support for assistance.");
    }
    if (!student.password) {
        throw new Errors_1.UnauthorizedError("This account uses social login. Please sign in with Google or GitHub.");
    }
    const valid = await bcryptjs_1.default.compare(password, student.password);
    if (!valid) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    if (!student.isActive) {
        throw new Errors_1.ForbiddenError("Account is deactivated");
    }
    const { token } = await startSession(student.id, clientIP);
    const { password: studentPassword, activeSessionToken, ...rest } = student;
    return { user: { ...rest, hasPassword: !!studentPassword }, token };
};
exports.loginService = loginService;
/** Clearing the session server-side is best-effort: an invalid token still logs out. */
const logoutService = async (studentId) => {
    if (!studentId)
        return;
    try {
        await prisma_1.default.student.update({
            where: { id: studentId },
            data: { activeSessionToken: null },
        });
    }
    catch {
        // Account may no longer exist; the cookie is cleared regardless.
    }
};
exports.logoutService = logoutService;
/** Always reports success, so the endpoint cannot be used to enumerate accounts. */
const forgotPasswordService = async (email) => {
    const student = await prisma_1.default.student.findUnique({ where: { email } });
    if (!student)
        return { email };
    const otp = (0, email_1.generateOTP)();
    (0, email_1.StoreForgetOtp)(email, otp);
    const result = await (0, email_1.ForgetPasswordMail)(email, otp);
    if (!result.success) {
        throw new Errors_1.InternalServerError(result.error || "Failed to send password reset email. Please try again.");
    }
    return { email };
};
exports.forgotPasswordService = forgotPasswordService;
const verifyForgotOtpService = (email, otp) => {
    const verification = (0, email_1.VerifyForgetOtp)(email, otp);
    if (!verification.valid) {
        throw new Errors_1.BadRequestError(verification.message || "Invalid or expired OTP. Please try again.");
    }
    return { email, otpVerified: true };
};
exports.verifyForgotOtpService = verifyForgotOtpService;
const resetPasswordService = async (email, otp, newPassword) => {
    const verification = (0, email_1.VerifyForgetOtp)(email, otp);
    if (!verification.valid) {
        throw new Errors_1.BadRequestError(verification.message ||
            "Invalid or expired OTP. Please request a new password reset.");
    }
    const hashed = await bcryptjs_1.default.hash(newPassword, BCRYPT_ROUNDS);
    const updated = await prisma_1.default.student.update({
        where: { email },
        data: { password: hashed },
        select: { id: true, email: true, firstName: true, lastName: true },
    });
    (0, email_1.ClearForgetOtp)(email);
    return { email: updated.email, firstName: updated.firstName };
};
exports.resetPasswordService = resetPasswordService;
const getCurrentUserService = async (studentId, sessionToken) => {
    const student = await prisma_1.default.student.findUnique({
        where: { id: studentId },
        select: {
            ...studentSelect,
            updatedAt: true,
            activeSessionToken: true,
            password: true,
        },
    });
    if (!student) {
        throw new Errors_1.UnauthorizedError("Student not found.");
    }
    if (sessionToken && student.activeSessionToken !== sessionToken) {
        throw new Errors_1.UnauthorizedError("Session expired. You have been logged in from another device.");
    }
    const { activeSessionToken, password, ...rest } = student;
    return { user: { ...rest, hasPassword: !!password } };
};
exports.getCurrentUserService = getCurrentUserService;
const updateProfileService = async (studentId, input) => {
    const updates = {};
    for (const [key, value] of Object.entries(input)) {
        if (value === undefined)
            continue;
        updates[key] =
            key === "dateOfBirth" ? (value ? new Date(value) : null) : value;
    }
    const student = await prisma_1.default.student.update({
        where: { id: studentId },
        data: updates,
        select: { ...studentSelect, updatedAt: true, password: true },
    });
    const { password, ...rest } = student;
    return { user: { ...rest, hasPassword: !!password } };
};
exports.updateProfileService = updateProfileService;
const changePasswordService = async (studentId, currentPassword, newPassword) => {
    const student = await prisma_1.default.student.findUnique({
        where: { id: studentId },
        select: { id: true, password: true },
    });
    if (!student) {
        throw new Errors_1.NotFoundError("Student not found.");
    }
    // OAuth accounts have no password to compare against; bcrypt would throw.
    if (!student.password) {
        throw new Errors_1.BadRequestError("This account uses social login and has no password to change.");
    }
    const valid = await bcryptjs_1.default.compare(currentPassword, student.password);
    if (!valid) {
        throw new Errors_1.BadRequestError("Current password is incorrect.");
    }
    const hashed = await bcryptjs_1.default.hash(newPassword, BCRYPT_ROUNDS);
    await prisma_1.default.student.update({
        where: { id: student.id },
        data: { password: hashed },
    });
};
exports.changePasswordService = changePasswordService;
