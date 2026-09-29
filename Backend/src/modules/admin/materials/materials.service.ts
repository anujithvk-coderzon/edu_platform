import prisma from "../../../lib/prisma";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../../errors/Errors";
import { MaterialType } from "../../../generated/prisma/client";
import { Delete_File } from "../../../lib/cdnStorage";
import { deleteVideoFromBunnyStream } from "../../../lib/bunnyStream";
import { recalculateAndUpdateProgress } from "../../../lib/progressCalculator";
import type { CreateMaterialInput, UpdateMaterialInput } from "./materials.validation";

/** The staff member performing the action: an Admin or a Tutor. */
export interface Caller {
  id: string;
  role?: "Admin" | "Tutor";
}

/** Author block returned alongside every material. */
const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
} as const;

/** The owning chapter, trimmed to what the admin UI renders. */
const moduleSelect = {
  id: true,
  title: true,
} as const;

/**
 * Access control: an Admin reaches every course; a Tutor only reaches the
 * courses they created or were assigned to.
 */
const assertCourseAccess = (
  caller: Caller,
  course: { creatorId: string; tutorId: string | null },
  message: string,
) => {
  if (caller.role === "Admin") return;
  const hasAccess = course.creatorId === caller.id || course.tutorId === caller.id;
  if (!hasAccess) {
    throw new ForbiddenError(message);
  }
};

/**
 * Removes the stored asset that backs a material.
 *
 * VIDEO materials store a bare Bunny Stream GUID, everything else stores a
 * bare relative CDN path — both helpers below need those raw values, so the
 * `fileUrl` handed in here must be the database value, never an absolute URL
 * rebuilt by the media middleware.
 */
const deleteMaterialAsset = async (type: MaterialType, fileUrl: string) => {
  if (type === MaterialType.VIDEO) {
    const guid = fileUrl;
    console.log(`🎬 Deleting video from Bunny Stream: ${guid}`);
    const deleted = await deleteVideoFromBunnyStream(guid);
    if (deleted) {
      console.log(`✅ Deleted video from Bunny Stream: ${guid}`);
    } else {
      console.log(`⚠️ Failed to delete video from Bunny Stream: ${guid}`);
    }
    return;
  }

  // PDF (and any other storage-backed type) lives in Bunny Storage.
  await Delete_File(fileUrl);
  console.log(`✅ Deleted material from Bunny Storage: ${fileUrl}`);
};

/**
 * Recalculates progress for every enrollment in a course after its material
 * set changes.
 *
 * Completed status is preserved: a student who already finished the course
 * never has their progress reduced by newly added content — they are flagged
 * with `hasNewContent` instead. Failures are logged and swallowed so that
 * creating or deleting a material never fails on a bookkeeping error.
 */
const recalculateCourseEnrollments = async (courseId: string) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: {
        studentId: true,
        completedAt: true,
        status: true,
        progressPercentage: true,
      },
    });

    const [materials, assignments] = await Promise.all([
      prisma.material.findMany({
        where: { courseId },
        select: { id: true, createdAt: true },
      }),
      prisma.assignment.findMany({ where: { courseId }, select: { id: true } }),
    ]);

    const existingMaterialIds = materials.map((m) => m.id);
    const totalItems = materials.length + assignments.length;

    for (const enrollment of enrollments) {
      const wasCompleted = !!enrollment.completedAt;

      // Material added after the completion date counts as new content.
      let hasNewContent = false;
      if (wasCompleted && enrollment.completedAt) {
        hasNewContent = materials.some((m) => m.createdAt > enrollment.completedAt!);
      }

      const [completedMaterialsCount, submittedAssignmentsCount] = await Promise.all([
        prisma.progress.count({
          where: {
            studentId: enrollment.studentId,
            courseId,
            isCompleted: true,
            materialId: { in: existingMaterialIds },
          },
        }),
        prisma.assignmentSubmission.count({
          where: {
            studentId: enrollment.studentId,
            assignment: { courseId },
          },
        }),
      ]);

      const completedItems = completedMaterialsCount + submittedAssignmentsCount;
      const progressPercentage =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      if (wasCompleted) {
        // Keep status COMPLETED and progress at 100%; only refresh the count
        // and clear the new-content flag once they have caught up.
        const finalHasNewContent = progressPercentage === 100 ? false : hasNewContent;

        await prisma.enrollment.update({
          where: { studentId_courseId: { studentId: enrollment.studentId, courseId } },
          data: {
            completedMaterials: completedMaterialsCount,
            hasNewContent: finalHasNewContent,
          },
        });
      } else {
        await prisma.enrollment.update({
          where: { studentId_courseId: { studentId: enrollment.studentId, courseId } },
          data: {
            progressPercentage,
            completedMaterials: completedMaterialsCount,
            hasNewContent: false,
            ...(progressPercentage === 100 && {
              status: "COMPLETED",
              completedAt: new Date(),
            }),
            ...(progressPercentage < 100 &&
              enrollment.status === "COMPLETED" && {
                status: "ACTIVE",
                completedAt: null,
              }),
          },
        });
      }
    }
  } catch (error) {
    console.error("Error recalculating course enrollments:", error);
  }
};

export const getCourseMaterialsService = async (courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw new NotFoundError("Course not found");
  }

  // Grouped by chapter, then by the order the admin arranged them in.
  const materials = await prisma.material.findMany({
    where: { courseId },
    include: {
      author: { select: authorSelect },
      module: { select: moduleSelect },
    },
    orderBy: [{ moduleId: "asc" }, { orderIndex: "asc" }],
  });

  return { materials };
};

export const getMaterialByIdService = async (callerId: string, materialId: string) => {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    include: {
      course: { select: { id: true, title: true, creatorId: true } },
      author: { select: authorSelect },
      module: { select: moduleSelect },
    },
  });

  if (!material) {
    throw new NotFoundError("Material not found");
  }

  // Opening a material counts as access; timeSpent accrues a minute per open.
  await prisma.progress.upsert({
    where: {
      studentId_courseId_materialId: {
        studentId: callerId,
        courseId: material.courseId,
        materialId: material.id,
      },
    },
    update: { lastAccessed: new Date(), timeSpent: { increment: 1 } },
    create: {
      studentId: callerId,
      courseId: material.courseId,
      materialId: material.id,
      lastAccessed: new Date(),
      timeSpent: 1,
    },
  });

  // fileUrl is resolved to an absolute URL by the media middleware on the way out.
  return { material };
};

export const createMaterialService = async (
  caller: Caller,
  input: CreateMaterialInput,
) => {
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });

  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseAccess(
    caller,
    course,
    "Not authorized to add materials to this course",
  );

  // A LINK material is nothing but its URL, so it cannot be created without one.
  if (input.type === MaterialType.LINK && !input.fileUrl) {
    throw new BadRequestError("File URL is required for LINK type materials");
  }

  const material = await prisma.material.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      fileUrl: input.fileUrl,
      content: input.content,
      orderIndex: input.orderIndex,
      courseId: input.courseId,
      moduleId: input.moduleId,
      authorId: caller.id,
      isPublic: input.isPublic,
    },
    include: {
      author: { select: authorSelect },
      module: { select: moduleSelect },
    },
  });

  // The course just gained an item, so every enrollment's share of it moves.
  await recalculateCourseEnrollments(input.courseId);

  return { material };
};

export const updateMaterialService = async (
  caller: Caller,
  materialId: string,
  input: UpdateMaterialInput,
) => {
  // Only the keys the client actually sent reach Prisma.
  const updates: Record<string, unknown> = {};
  if (input.title) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.type) updates.type = input.type;
  if (input.fileUrl !== undefined) updates.fileUrl = input.fileUrl;
  if (input.content !== undefined) updates.content = input.content;
  if (input.orderIndex !== undefined) updates.orderIndex = input.orderIndex;
  if (input.moduleId !== undefined) updates.moduleId = input.moduleId;
  if (typeof input.isPublic === "boolean") updates.isPublic = input.isPublic;

  const existingMaterial = await prisma.material.findUnique({
    where: { id: materialId },
    include: {
      course: { select: { creatorId: true, tutorId: true } },
    },
  });

  if (!existingMaterial) {
    throw new NotFoundError("Material not found");
  }

  assertCourseAccess(
    caller,
    existingMaterial.course,
    "Not authorized to update this material",
  );

  // Swapping the file in means the old asset is now orphaned — drop it. The
  // stored (bare) fileUrl is passed through untouched, and the *existing*
  // type decides where it lives. A failure here must not block the update.
  if (
    input.fileUrl !== undefined &&
    existingMaterial.fileUrl &&
    existingMaterial.fileUrl !== input.fileUrl &&
    existingMaterial.type !== MaterialType.LINK
  ) {
    try {
      await deleteMaterialAsset(existingMaterial.type, existingMaterial.fileUrl);
    } catch (error) {
      console.error(
        `❌ Error deleting old material file: ${existingMaterial.fileUrl}`,
        error,
      );
      // Continue with update even if deletion fails
    }
  }

  const material = await prisma.material.update({
    where: { id: materialId },
    data: updates,
    include: {
      author: { select: authorSelect },
      module: { select: moduleSelect },
    },
  });

  return { material };
};

export const deleteMaterialService = async (caller: Caller, materialId: string) => {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    include: {
      course: { select: { creatorId: true, tutorId: true } },
    },
  });

  if (!material) {
    throw new NotFoundError("Material not found");
  }

  assertCourseAccess(
    caller,
    material.course,
    "Not authorized to delete this material",
  );

  // A LINK owns no asset; everything else does. The stored bare value goes
  // straight to the CDN helpers.
  if (material.fileUrl && material.type !== MaterialType.LINK) {
    await deleteMaterialAsset(material.type, material.fileUrl);
  }

  const courseId = material.courseId;

  await prisma.material.delete({ where: { id: materialId } });

  // The course just lost an item, so every enrollment's share of it moves.
  await recalculateCourseEnrollments(courseId);
};

export const completeMaterialService = async (
  callerId: string,
  materialId: string,
) => {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { id: true, courseId: true },
  });

  if (!material) {
    throw new NotFoundError("Material not found");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: callerId, courseId: material.courseId },
    },
  });

  if (!enrollment) {
    throw new ForbiddenError("You are not enrolled in this course");
  }

  await prisma.progress.upsert({
    where: {
      studentId_courseId_materialId: {
        studentId: callerId,
        courseId: material.courseId,
        materialId: material.id,
      },
    },
    update: { isCompleted: true, lastAccessed: new Date() },
    create: {
      studentId: callerId,
      courseId: material.courseId,
      materialId: material.id,
      isCompleted: true,
      lastAccessed: new Date(),
    },
  });

  // Centralized calculator — it counts both materials and assignments.
  const stats = await recalculateAndUpdateProgress(callerId, material.courseId);

  return {
    progressPercentage: stats.progressPercentage,
    isCompleted: true,
  };
};
