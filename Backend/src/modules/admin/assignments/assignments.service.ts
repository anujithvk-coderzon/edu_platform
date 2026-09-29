import * as fs from "fs";
import * as path from "path";
import prisma from "../../../lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors/Errors";
import type {
  CreateAssignmentInput,
  GradeSubmissionInput,
  UpdateAssignmentInput,
} from "./assignments.validation";

/** The staff member performing the action: an Admin or a Tutor. */
export interface Caller {
  id: string;
  role?: "Admin" | "Tutor";
}

/** The owning course, trimmed to what the admin UI renders. */
const courseSelect = {
  id: true,
  title: true,
} as const;

/** Author block returned alongside every assignment. */
const creatorSelect = {
  firstName: true,
  lastName: true,
} as const;

/**
 * Access control, phrased as a Prisma filter so the lookup and the permission
 * check stay a single query.
 *
 * An Admin reaches every course; a Tutor only reaches the courses they created
 * or were assigned to.
 */
const courseScope = (caller: Caller, courseId: string) =>
  caller.role === "Admin"
    ? { id: courseId }
    : {
        id: courseId,
        OR: [
          { creatorId: caller.id }, // Course they created
          { tutorId: caller.id }, // Course assigned to them
        ],
      };

/**
 * The same idea for a single assignment: an Admin reaches every one, a Tutor
 * only the assignments they authored.
 */
const assignmentScope = (caller: Caller, assignmentId: string) =>
  caller.role === "Admin"
    ? { id: assignmentId }
    : { id: assignmentId, creatorId: caller.id };

export const createAssignmentService = async (
  caller: Caller,
  input: CreateAssignmentInput,
) => {
  const course = await prisma.course.findFirst({
    where: courseScope(caller, input.courseId),
  });

  if (!course) {
    throw new NotFoundError(
      "Course not found or you do not have permission to add assignments to it.",
    );
  }

  // `|| 100` is kept verbatim: a posted score of 0 still falls back to 100,
  // exactly as the original handler behaved.
  const assignment = await prisma.assignment.create({
    data: {
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      maxScore: input.maxScore || 100,
      courseId: input.courseId,
      creatorId: caller.id,
    },
    include: {
      course: { select: courseSelect },
      creator: { select: creatorSelect },
    },
  });

  return { assignment };
};

export const getCourseAssignmentsService = async (
  caller: Caller,
  courseId: string,
) => {
  const course = await prisma.course.findFirst({
    where: courseScope(caller, courseId),
  });

  if (!course) {
    throw new NotFoundError(
      "Course not found or you do not have permission to view its assignments.",
    );
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    include: {
      _count: { select: { submissions: true } },
      submissions: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // The submission rows are only pulled to count the ungraded ones; they are
  // dropped again so the payload keeps the shape the admin UI expects.
  const assignmentsWithCounts = assignments.map((assignment) => {
    const ungradedCount = assignment.submissions.filter(
      (s) => s.status !== "GRADED",
    ).length;
    const { submissions, ...assignmentData } = assignment;
    return {
      ...assignmentData,
      ungradedSubmissions: ungradedCount,
    };
  });

  return { assignments: assignmentsWithCounts };
};

export const getAssignmentByIdService = async (caller: Caller, id: string) => {
  const assignment = await prisma.assignment.findFirst({
    where: assignmentScope(caller, id),
    include: {
      course: { select: courseSelect },
      creator: { select: creatorSelect },
      _count: { select: { submissions: true } },
    },
  });

  if (!assignment) {
    throw new NotFoundError(
      "Assignment not found or you do not have permission to view it.",
    );
  }

  return { assignment };
};

export const updateAssignmentService = async (
  caller: Caller,
  id: string,
  input: UpdateAssignmentInput,
) => {
  const existingAssignment = await prisma.assignment.findFirst({
    where: assignmentScope(caller, id),
  });

  if (!existingAssignment) {
    throw new NotFoundError(
      "Assignment not found or you do not have permission to update it.",
    );
  }

  // Which keys reach Prisma is decided exactly as the original handler did:
  // truthy fields are applied, `dueDate` is applied whenever the key was sent
  // (so an explicit null clears it), and a `maxScore` of 0 is ignored.
  const assignment = await prisma.assignment.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description && { description: input.description }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      }),
      ...(input.maxScore && { maxScore: input.maxScore }),
    },
    include: {
      course: { select: courseSelect },
      creator: { select: creatorSelect },
    },
  });

  return { assignment };
};

export const deleteAssignmentService = async (caller: Caller, id: string) => {
  const assignment = await prisma.assignment.findFirst({
    where: assignmentScope(caller, id),
    include: {
      submissions: { select: { fileUrl: true } },
    },
  });

  if (!assignment) {
    throw new NotFoundError(
      "Assignment not found or you do not have permission to delete it.",
    );
  }

  // Submission files live on local disk, keyed by the stored `/uploads/...`
  // path. A file that cannot be removed is logged and skipped — losing an
  // orphaned upload must never fail the delete.
  let deletedFilesCount = 0;
  assignment.submissions.forEach((submission) => {
    if (submission.fileUrl) {
      try {
        const filename = submission.fileUrl.startsWith("/uploads/")
          ? submission.fileUrl.replace("/uploads/", "")
          : path.basename(submission.fileUrl);
        const uploadDir = process.env.UPLOAD_DIR || "./uploads";
        const filePath = path.join(uploadDir, filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedFilesCount++;
          console.log(`🗑️ Deleted submission file: ${filePath}`);
        }
      } catch (error) {
        console.error("Error deleting submission file:", error);
      }
    }
  });

  // Submissions go with it (cascade delete).
  await prisma.assignment.delete({
    where: { id },
  });

  console.log(
    `✅ Assignment deleted: ${assignment.title}, Files cleaned up: ${deletedFilesCount}`,
  );

  return { deletedFilesCount };
};

export const getAssignmentSubmissionsService = async (
  caller: Caller,
  assignmentId: string,
) => {
  const assignment = await prisma.assignment.findFirst({
    where: assignmentScope(caller, assignmentId),
  });

  if (!assignment) {
    throw new NotFoundError(
      "Assignment not found or you do not have permission to view its submissions.",
    );
  }

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      assignment: { select: { title: true, maxScore: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  // Debug logging to check fileUrl values
  console.log("📋 Fetched submissions for assignment:", assignmentId);
  submissions.forEach((sub, index) => {
    console.log(`  Submission ${index + 1}:`, {
      id: sub.id,
      studentName: sub.student
        ? `${sub.student.firstName} ${sub.student.lastName}`
        : "Unknown",
      hasContent: !!sub.content && sub.content.trim() !== "",
      contentLength: sub.content ? sub.content.length : 0,
      fileUrl: sub.fileUrl,
      hasFileUrl: !!sub.fileUrl && sub.fileUrl.trim() !== "",
      status: sub.status,
      score: sub.score,
    });
  });

  return { submissions };
};

export const gradeSubmissionService = async (
  caller: Caller,
  submissionId: string,
  input: GradeSubmissionInput,
) => {
  // Ownership runs through the parent assignment, so the submission is fetched
  // first and the permission check applied afterwards.
  const submission = await prisma.assignmentSubmission.findFirst({
    where: { id: submissionId },
    include: {
      assignment: { select: { creatorId: true, maxScore: true } },
    },
  });

  if (!submission) {
    throw new NotFoundError("Submission not found.");
  }

  // Admins have full access, Tutors can only grade their own assignments.
  if (
    caller.role !== "Admin" &&
    submission.assignment.creatorId !== caller.id
  ) {
    throw new ForbiddenError("Not authorized to grade this submission.");
  }

  if (input.score > submission.assignment.maxScore) {
    throw new BadRequestError(
      `Score cannot exceed maximum score of ${submission.assignment.maxScore}`,
    );
  }

  const gradedSubmission = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      score: input.score,
      feedback: input.feedback || null,
      status: "GRADED",
      gradedAt: new Date(),
    },
    include: {
      student: { select: { firstName: true, lastName: true, email: true } },
      assignment: { select: { title: true, maxScore: true } },
    },
  });

  return { submission: gradedSubmission };
};
