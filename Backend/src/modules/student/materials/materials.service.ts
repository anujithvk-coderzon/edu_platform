import prisma from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors/Errors";
import { recalculateAndUpdateProgress } from "../../../lib/progressCalculator";

/** Enrolment is the access check for every material operation. */
const requireEnrollment = async (studentId: string, courseId: string, action: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!enrollment) {
    throw new ForbiddenError(
      `You must be enrolled in this course to ${action}`,
    );
  }
};

export const getMaterialByIdService = async (
  studentId: string,
  materialId: string,
) => {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    // The learn page needs the lesson itself, not the row's bookkeeping.
    // `include` was returning authorId and course.creatorId -- both Admin
    // account ids -- plus isPublic and the timestamps, to every student.
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      fileUrl: true,
      content: true,
      orderIndex: true,
      moduleId: true,
      courseId: true,
      course: { select: { id: true, title: true } },
    },
  });

  if (!material) {
    throw new NotFoundError("Material not found");
  }

  await requireEnrollment(studentId, material.courseId, "access materials");

  // Viewing counts as access; timeSpent accrues a minute per open.
  await prisma.progress.upsert({
    where: {
      studentId_courseId_materialId: {
        studentId,
        courseId: material.courseId,
        materialId: material.id,
      },
    },
    update: { lastAccessed: new Date(), timeSpent: { increment: 1 } },
    create: {
      studentId,
      courseId: material.courseId,
      materialId: material.id,
      lastAccessed: new Date(),
      timeSpent: 1,
    },
  });

  // fileUrl is resolved to an absolute URL by the media middleware on the way out.
  return { material };
};

export const completeMaterialService = async (
  studentId: string,
  materialId: string,
) => {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      courseId: true,
      course: { select: { id: true, title: true } },
    },
  });

  if (!material) {
    throw new NotFoundError("Material not found");
  }

  await requireEnrollment(studentId, material.courseId, "complete materials");

  await prisma.progress.upsert({
    where: {
      studentId_courseId_materialId: {
        studentId,
        courseId: material.courseId,
        materialId: material.id,
      },
    },
    update: { isCompleted: true, lastAccessed: new Date() },
    create: {
      studentId,
      courseId: material.courseId,
      materialId: material.id,
      isCompleted: true,
      lastAccessed: new Date(),
    },
  });

  const stats = await recalculateAndUpdateProgress(studentId, material.courseId);

  return {
    progressPercentage: stats.progressPercentage,
    isCompleted: true,
    totalItems: stats.totalItems,
    completedItems: stats.completedItems,
  };
};
