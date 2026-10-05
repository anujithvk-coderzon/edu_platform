import prisma from "../../../lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../../../errors/Errors";
import { Upload_Files } from "../../../lib/cdnStorage";
import { Upload_Files_Stream } from "../../../lib/cdnStreaming";
import { Upload_Files_Local } from "../../../lib/localStorage";
import type { SubmitAssignmentInput } from "./assignments.validation";

const LARGE_FILE_BYTES = 20 * 1024 * 1024;

export const listCourseAssignmentsService = async (
  studentId: string,
  courseId: string,
) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!enrollment) {
    throw new ForbiddenError("You are not enrolled in this course.");
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      maxScore: true,
      submissions: {
        where: { studentId },
        select: {
          id: true,
          status: true,
          score: true,
          submittedAt: true,
          gradedAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return { assignments };
};

export const submitAssignmentService = async (
  studentId: string,
  assignmentId: string,
  input: SubmitAssignmentInput,
) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    // Used only to authorise and to check the deadline, so pull just that.
    select: {
      id: true,
      dueDate: true,
      courseId: true,
      course: {
        select: { enrollments: { where: { studentId }, select: { id: true } } },
      },
    },
  });

  if (!assignment) {
    throw new NotFoundError("Assignment not found.");
  }
  if (assignment.course.enrollments.length === 0) {
    throw new ForbiddenError("You are not enrolled in this course.");
  }

  const existing = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
  if (existing) {
    throw new BadRequestError("You have already submitted this assignment.");
  }

  if (assignment.dueDate && new Date() > assignment.dueDate) {
    throw new BadRequestError("Assignment due date has passed.");
  }

  const submission = await prisma.assignmentSubmission.create({
    data: {
      content: input.content || "",
      fileUrl: input.fileUrl || null,
      assignmentId,
      studentId,
      status: "SUBMITTED",
    },
    select: {
      id: true,
      content: true,
      fileUrl: true,
      status: true,
      score: true,
      feedback: true,
      submittedAt: true,
      gradedAt: true,
      assignment: { select: { title: true, maxScore: true, dueDate: true } },
    },
  });

  // Progress rows can outlive their material, so completion is counted only
  // against materials that still exist.
  const existingMaterials = await prisma.material.findMany({
    where: { courseId: assignment.courseId },
    select: { id: true },
  });
  const existingMaterialIds = existingMaterials.map((m) => m.id);

  const [completedMaterials, totalAssignments, submittedAssignments] =
    await Promise.all([
      prisma.progress.count({
        where: {
          studentId,
          courseId: assignment.courseId,
          isCompleted: true,
          materialId: { in: existingMaterialIds },
        },
      }),
      prisma.assignment.count({ where: { courseId: assignment.courseId } }),
      prisma.assignmentSubmission.count({
        where: { studentId, assignment: { courseId: assignment.courseId } },
      }),
    ]);

  const totalMaterials = existingMaterials.length;
  const totalItems = totalMaterials + totalAssignments;
  const completedItems = completedMaterials + submittedAssignments;
  const progressPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  await prisma.enrollment.update({
    where: {
      studentId_courseId: { studentId, courseId: assignment.courseId },
    },
    data: {
      progressPercentage,
      ...(progressPercentage === 100 && {
        completedAt: new Date(),
        status: "COMPLETED",
      }),
    },
  });

  return {
    submission,
    progressUpdate: { progressPercentage, totalItems, completedItems },
  };
};

export const getSubmissionService = async (
  studentId: string,
  assignmentId: string,
) => {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    select: {
      id: true,
      content: true,
      fileUrl: true,
      status: true,
      score: true,
      feedback: true,
      submittedAt: true,
      gradedAt: true,
      assignment: { select: { title: true, maxScore: true, dueDate: true } },
    },
  });
  return { submission };
};

export const uploadAssignmentFileService = async (
  file: Express.Multer.File,
) => {
  const useLocal =
    process.env.NODE_ENV === "development" || !process.env.BUNNY_API_KEY;

  const fileUrl = useLocal
    ? await Upload_Files_Local("assignments", file)
    : file.size > LARGE_FILE_BYTES
      ? await Upload_Files_Stream("assignments", file)
      : await Upload_Files("assignments", file);

  if (!fileUrl) {
    throw new InternalServerError(
      "Failed to upload assignment file to storage",
    );
  }

  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    fileUrl,
  };
};
