import prisma from "../../../lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors/Errors";
import {
  sendTutorRejectionEmail,
  sendTutorWelcomeEmail,
} from "../../../lib/email";
import type { TutorRequestQuery } from "./tutorRequests.validation";

/** Columns exposed for a tutor request — the password hash never leaves here. */
const requestSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * `adminOnly` only proves the caller is staff; tutors are staff too. Tutor
 * requests are admin-only, so the role is checked again here with the message
 * each handler already returned.
 */
const assertAdmin = (role: string | undefined, action: string) => {
  if (role !== "Admin") {
    throw new ForbiddenError(`Only admins can ${action} tutor requests`);
  }
};

export const getPendingTutorRequestsCountService = async (
  role: string | undefined,
) => {
  assertAdmin(role, "view");

  // All stored requests are pending — processed ones are deleted.
  const count = await prisma.tutorRequest.count();
  return { count };
};

export const getAllTutorRequestsService = async (
  role: string | undefined,
  _query: TutorRequestQuery,
) => {
  assertAdmin(role, "view");

  // The `status` filter is accepted for the API contract only: TutorRequest has
  // no status column, and processed requests are deleted, so every row returned
  // is pending regardless of the value passed.
  const requests = await prisma.tutorRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: requestSelect,
  });

  return { requests };
};

/**
 * Creates the tutor account from the request and removes the request in one
 * transaction, so a failed delete cannot leave a duplicate account behind.
 */
export const acceptTutorRequestService = async (
  role: string | undefined,
  requestId: string,
) => {
  assertAdmin(role, "accept");

  const tutorRequest = await prisma.tutorRequest.findUnique({
    where: { id: requestId },
  });
  if (!tutorRequest) {
    throw new NotFoundError("Tutor request not found");
  }

  // Race condition protection: the email may have been claimed since the
  // request was filed.
  const existingUser = await prisma.admin.findUnique({
    where: { email: tutorRequest.email },
  });
  if (existingUser) {
    throw new BadRequestError("A user with this email already exists");
  }

  const tutor = await prisma.$transaction(async (tx) => {
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
  const emailResult = await sendTutorWelcomeEmail(tutor.email, tutor.firstName);
  if (!emailResult.success) {
    console.error("Failed to send welcome email:", emailResult.error);
  }

  return { tutor };
};

/** Emails the applicant first, then removes the request. */
export const rejectTutorRequestService = async (
  role: string | undefined,
  requestId: string,
) => {
  assertAdmin(role, "reject");

  const tutorRequest = await prisma.tutorRequest.findUnique({
    where: { id: requestId },
  });
  if (!tutorRequest) {
    throw new NotFoundError("Tutor request not found");
  }

  // A failed rejection email must not fail the rejection.
  const emailResult = await sendTutorRejectionEmail(
    tutorRequest.email,
    tutorRequest.firstName,
  );
  if (!emailResult.success) {
    console.error("Failed to send rejection email:", emailResult.error);
  }

  await prisma.tutorRequest.delete({ where: { id: requestId } });
};
