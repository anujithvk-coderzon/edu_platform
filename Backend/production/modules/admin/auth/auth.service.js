"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordService = exports.updateProfileService = exports.getCurrentUserService = exports.resetPasswordService = exports.verifyForgotOtpService = exports.forgotPasswordService = exports.loginService = exports.registerTutorPublicService = exports.verifyTutorOtpService = exports.sendTutorOtpService = exports.checkTutorEmailService = exports.registerTutorService = exports.registerUserService = exports.bootstrapAdminService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const email_1 = require("../../../lib/email");
const jwt_1 = require("../../../lib/jwt");
const BCRYPT_ROUNDS = 12;
/** Columns returned to the client for a staff account. */
const staffSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true,
    createdAt: true,
};
const assertEmailAvailable = async (email) => {
    const existing = await prisma_1.default.admin.findUnique({ where: { email } });
    if (existing) {
        throw new Errors_1.BadRequestError("User already exists with this email");
    }
};
/**
 * Creates the very first admin. Disabled permanently once any admin exists —
 * otherwise it would be an open door to full access.
 */
const bootstrapAdminService = async (input) => {
    const adminExists = await prisma_1.default.admin.findFirst();
    if (adminExists) {
        throw new Errors_1.ForbiddenError("Bootstrap endpoint is disabled. First admin has already been created.");
    }
    const existing = await prisma_1.default.admin.findUnique({
        where: { email: input.email },
    });
    if (existing) {
        throw new Errors_1.BadRequestError("Admin already exists with this email");
    }
    const user = await prisma_1.default.admin.create({
        data: {
            email: input.email,
            password: await bcryptjs_1.default.hash(input.password, BCRYPT_ROUNDS),
            firstName: input.firstName,
            lastName: input.lastName,
            role: "Admin",
            isActive: true,
        },
        select: staffSelect,
    });
    return { user, token: (0, jwt_1.generateAdminToken)(user.id) };
};
exports.bootstrapAdminService = bootstrapAdminService;
/** Staff creation by an existing admin. Accounts are active immediately. */
const registerUserService = async (input) => {
    const userRole = input.role === "Admin" ? "Admin" : "Tutor";
    await assertEmailAvailable(input.email);
    const user = await prisma_1.default.admin.create({
        data: {
            email: input.email,
            password: await bcryptjs_1.default.hash(input.password, BCRYPT_ROUNDS),
            firstName: input.firstName,
            lastName: input.lastName,
            role: userRole,
            isActive: true,
            isVerified: true,
        },
        select: staffSelect,
    });
    // A failed welcome email must not fail the account creation.
    const emailResult = await (0, email_1.StaffWelcomeEmail)(input.email, input.firstName, userRole);
    if (!emailResult.success) {
        console.error("Failed to send welcome email:", emailResult.error);
    }
    return { user, userRole };
};
exports.registerUserService = registerUserService;
/** Tutor created by an admin — inactive until explicitly activated. */
const registerTutorService = async (input) => {
    await assertEmailAvailable(input.email);
    const tutor = await prisma_1.default.admin.create({
        data: {
            email: input.email,
            password: await bcryptjs_1.default.hash(input.password, BCRYPT_ROUNDS),
            firstName: input.firstName,
            lastName: input.lastName,
            role: "Tutor",
            isActive: false,
        },
        select: staffSelect,
    });
    return { tutor };
};
exports.registerTutorService = registerTutorService;
const checkTutorEmailService = async (email) => {
    const existing = await prisma_1.default.admin.findUnique({ where: { email } });
    if (existing) {
        throw new Errors_1.BadRequestError("An account with this email already exists");
    }
    return { email, available: true };
};
exports.checkTutorEmailService = checkTutorEmailService;
const sendTutorOtpService = async (email) => {
    const existingAdmin = await prisma_1.default.admin.findUnique({ where: { email } });
    if (existingAdmin) {
        throw new Errors_1.BadRequestError("An account with this email already exists. Please login instead.");
    }
    const existingRequest = await prisma_1.default.tutorRequest.findUnique({
        where: { email },
    });
    if (existingRequest) {
        throw new Errors_1.BadRequestError("A registration request with this email is already pending approval. Please wait for admin review.");
    }
    const otp = (0, email_1.generateOTP)();
    (0, email_1.storeOTP)(email, otp, null);
    const result = await (0, email_1.sendTutorVerificationEmail)(email, otp);
    if (!result.success) {
        throw new Errors_1.InternalServerError(result.error || "Failed to send verification email. Please try again.");
    }
    return { email };
};
exports.sendTutorOtpService = sendTutorOtpService;
const verifyTutorOtpService = (email, otp) => {
    const verification = (0, email_1.verifyOTP)(email, otp);
    if (!verification.valid) {
        throw new Errors_1.BadRequestError(verification.message || "Invalid or expired OTP. Please try again.");
    }
    return { email, verified: true };
};
exports.verifyTutorOtpService = verifyTutorOtpService;
/** Public tutor self-signup: creates a request for an admin to review. */
const registerTutorPublicService = async (input) => {
    await assertEmailAvailable(input.email);
    const existingRequest = await prisma_1.default.tutorRequest.findUnique({
        where: { email: input.email },
    });
    if (existingRequest) {
        throw new Errors_1.BadRequestError("A registration request with this email is already pending approval");
    }
    const tutorRequest = await prisma_1.default.tutorRequest.create({
        data: {
            email: input.email,
            password: await bcryptjs_1.default.hash(input.password, BCRYPT_ROUNDS),
            firstName: input.firstName,
            lastName: input.lastName,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
        },
    });
    const emailResult = await (0, email_1.sendTutorPendingApprovalEmail)(input.email, input.firstName);
    if (!emailResult.success) {
        console.error("Failed to send pending approval email:", emailResult.error);
    }
    return { tutorRequest };
};
exports.registerTutorPublicService = registerTutorPublicService;
const loginService = async (email, password) => {
    const user = await prisma_1.default.admin.findUnique({ where: { email } });
    if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    if (!user.isActive) {
        throw new Errors_1.ForbiddenError("Account is deactivated");
    }
    const { password: _password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token: (0, jwt_1.generateAdminToken)(user.id) };
};
exports.loginService = loginService;
/** Always reports success, so the endpoint cannot be used to enumerate accounts. */
const forgotPasswordService = async (email) => {
    const admin = await prisma_1.default.admin.findUnique({ where: { email } });
    if (!admin)
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
    const updated = await prisma_1.default.admin.update({
        where: { email },
        data: { password: await bcryptjs_1.default.hash(newPassword, BCRYPT_ROUNDS) },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
        },
    });
    (0, email_1.ClearForgetOtp)(email);
    return updated;
};
exports.resetPasswordService = resetPasswordService;
const getCurrentUserService = async (adminId) => {
    const user = await prisma_1.default.admin.findUnique({
        where: { id: adminId },
        select: { ...staffSelect, avatar: true, isVerified: true, updatedAt: true },
    });
    if (!user) {
        throw new Errors_1.NotFoundError("User not found");
    }
    return { user };
};
exports.getCurrentUserService = getCurrentUserService;
const updateProfileService = async (adminId, input) => {
    const updates = {};
    for (const [key, value] of Object.entries(input)) {
        if (value !== undefined)
            updates[key] = value;
    }
    const user = await prisma_1.default.admin.update({
        where: { id: adminId },
        data: updates,
        select: { ...staffSelect, avatar: true, updatedAt: true },
    });
    return { user };
};
exports.updateProfileService = updateProfileService;
const changePasswordService = async (adminId, currentPassword, newPassword) => {
    const user = await prisma_1.default.admin.findUnique({
        where: { id: adminId },
        select: { id: true, password: true },
    });
    if (!user) {
        throw new Errors_1.NotFoundError("User not found");
    }
    const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!valid) {
        throw new Errors_1.BadRequestError("Current password is incorrect");
    }
    await prisma_1.default.admin.update({
        where: { id: user.id },
        data: { password: await bcryptjs_1.default.hash(newPassword, BCRYPT_ROUNDS) },
    });
};
exports.changePasswordService = changePasswordService;
