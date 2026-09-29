"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectTutorRequestService = exports.acceptTutorRequestService = exports.getAllTutorRequestsService = exports.getPendingTutorRequestsCountService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const email_1 = require("../../../lib/email");
/** Columns exposed for a tutor request — the password hash never leaves here. */
const requestSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    createdAt: true,
    updatedAt: true,
};
/**
 * `adminOnly` only proves the caller is staff; tutors are staff too. Tutor
 * requests are admin-only, so the role is checked again here with the message
 * each handler already returned.
 */
const assertAdmin = (role, action) => {
    if (role !== "Admin") {
        throw new Errors_1.ForbiddenError(`Only admins can ${action} tutor requests`);
    }
};
const getPendingTutorRequestsCountService = async (role) => {
    assertAdmin(role, "view");
    // All stored requests are pending — processed ones are deleted.
    const count = await prisma_1.default.tutorRequest.count();
    return { count };
};
exports.getPendingTutorRequestsCountService = getPendingTutorRequestsCountService;
const getAllTutorRequestsService = async (role, _query) => {
    assertAdmin(role, "view");
    // The `status` filter is accepted for the API contract only: TutorRequest has
    // no status column, and processed requests are deleted, so every row returned
    // is pending regardless of the value passed.
    const requests = await prisma_1.default.tutorRequest.findMany({
        orderBy: { createdAt: "desc" },
        select: requestSelect,
    });
    return { requests };
};
exports.getAllTutorRequestsService = getAllTutorRequestsService;
/**
 * Creates the tutor account from the request and removes the request in one
 * transaction, so a failed delete cannot leave a duplicate account behind.
 */
const acceptTutorRequestService = async (role, requestId) => {
    assertAdmin(role, "accept");
    const tutorRequest = await prisma_1.default.tutorRequest.findUnique({
        where: { id: requestId },
    });
    if (!tutorRequest) {
        throw new Errors_1.NotFoundError("Tutor request not found");
    }
    // Race condition protection: the email may have been claimed since the
    // request was filed.
    const existingUser = await prisma_1.default.admin.findUnique({
        where: { email: tutorRequest.email },
    });
    if (existingUser) {
        throw new Errors_1.BadRequestError("A user with this email already exists");
    }
    const tutor = await prisma_1.default.$transaction(async (tx) => {
        const newTutor = await tx.admin.create({
            data: {
                email: tutorRequest.email,
                password: tutorRequest.password, // Already hashed
                firstName: tutorRequest.firstName,
                lastName: tutorRequest.lastName,
                role: "Tutor",
                isActive: true,
                isVerified: true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
        await tx.tutorRequest.delete({ where: { id: requestId } });
        return newTutor;
    });
    // A failed welcome email must not fail the acceptance.
    const emailResult = await (0, email_1.sendTutorWelcomeEmail)(tutor.email, tutor.firstName);
    if (!emailResult.success) {
        console.error("Failed to send welcome email:", emailResult.error);
    }
    return { tutor };
};
exports.acceptTutorRequestService = acceptTutorRequestService;
/** Emails the applicant first, then removes the request. */
const rejectTutorRequestService = async (role, requestId) => {
    assertAdmin(role, "reject");
    const tutorRequest = await prisma_1.default.tutorRequest.findUnique({
        where: { id: requestId },
    });
    if (!tutorRequest) {
        throw new Errors_1.NotFoundError("Tutor request not found");
    }
    // A failed rejection email must not fail the rejection.
    const emailResult = await (0, email_1.sendTutorRejectionEmail)(tutorRequest.email, tutorRequest.firstName);
    if (!emailResult.success) {
        console.error("Failed to send rejection email:", emailResult.error);
    }
    await prisma_1.default.tutorRequest.delete({ where: { id: requestId } });
};
exports.rejectTutorRequestService = rejectTutorRequestService;
