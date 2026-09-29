import prisma from "../../../lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors/Errors";
import type {
  CreateModuleInput,
  ReorderModuleInput,
  UpdateModuleInput,
} from "./modules.validation";

/**
 * Course chapters (`courseModule`). Access rules carried over verbatim:
 * an "Admin" role bypasses every ownership check, anyone else must own the
 * course (creator) and, on write paths, may also be its assigned tutor.
 */
type UserRole = string | undefined;

const isAdmin = (userRole: UserRole) => userRole === "Admin";

export const getCourseModulesService = async (
  courseId: string,
  userId: string,
  userRole: UserRole,
) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new NotFoundError("Course not found");
  }

  if (course.creatorId !== userId && !isAdmin(userRole)) {
    throw new ForbiddenError("Access denied");
  }

  const modules = await prisma.courseModule.findMany({
    where: { courseId },
    include: {
      materials: {
        select: {
          id: true,
          title: true,
          type: true,
          orderIndex: true,
          createdAt: true,
        },
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  return { modules };
};

export const getModuleByIdService = async (
  id: string,
  userId: string,
  userRole: UserRole,
) => {
  const module = await prisma.courseModule.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          creatorId: true,
        },
      },
      materials: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!module) {
    throw new NotFoundError("Module not found");
  }

  if (module.course.creatorId !== userId && !isAdmin(userRole)) {
    throw new ForbiddenError("Access denied");
  }

  return { module };
};

export const createModuleService = async (
  input: CreateModuleInput,
  userId: string,
  userRole: UserRole,
) => {
  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
  });

  if (!course) {
    throw new NotFoundError("Course not found");
  }

  // Access control: Admin can add modules to any course, Tutors can add
  // modules to courses they created or are assigned to
  if (!isAdmin(userRole)) {
    const hasAccess =
      course.creatorId === userId || course.tutorId === userId;
    if (!hasAccess) {
      throw new ForbiddenError("Not authorized to add modules to this course");
    }
  }

  const module = await prisma.courseModule.create({
    data: {
      title: input.title,
      description: input.description,
      orderIndex: input.orderIndex,
      courseId: input.courseId,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      materials: true,
    },
  });

  return { module };
};

export const updateModuleService = async (
  id: string,
  input: UpdateModuleInput,
  userId: string,
  userRole: UserRole,
) => {
  // Only the keys the caller actually sent are written, matching the original
  // handler: a falsy title is ignored, description/orderIndex are applied
  // whenever they are present.
  const updates: Record<string, unknown> = {};
  if (input.title) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.orderIndex !== undefined) updates.orderIndex = input.orderIndex;

  const existingModule = await prisma.courseModule.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          creatorId: true,
          tutorId: true,
        },
      },
    },
  });

  if (!existingModule) {
    throw new NotFoundError("Module not found");
  }

  // Access control: Admin can update any module, Tutors can update modules in
  // courses they created or are assigned to
  if (!isAdmin(userRole)) {
    const hasAccess =
      existingModule.course.creatorId === userId ||
      existingModule.course.tutorId === userId;
    if (!hasAccess) {
      throw new ForbiddenError("Not authorized to update this module");
    }
  }

  const module = await prisma.courseModule.update({
    where: { id },
    data: updates,
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      materials: {
        select: {
          id: true,
          title: true,
          type: true,
          orderIndex: true,
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return { module };
};

export const deleteModuleService = async (
  id: string,
  userId: string,
  userRole: UserRole,
) => {
  const module = await prisma.courseModule.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          creatorId: true,
          tutorId: true,
        },
      },
      _count: {
        select: { materials: true },
      },
    },
  });

  if (!module) {
    throw new NotFoundError("Module not found");
  }

  // Access control: Admin can delete any module, Tutors can delete modules in
  // courses they created or are assigned to
  if (!isAdmin(userRole)) {
    const hasAccess =
      module.course.creatorId === userId || module.course.tutorId === userId;
    if (!hasAccess) {
      throw new ForbiddenError("Not authorized to delete this module");
    }
  }

  if (module._count.materials > 0) {
    throw new BadRequestError("Cannot delete module with existing materials");
  }

  await prisma.courseModule.delete({
    where: { id },
  });
};

export const reorderModuleService = async (
  id: string,
  input: ReorderModuleInput,
  userId: string,
  userRole: UserRole,
) => {
  const module = await prisma.courseModule.findUnique({
    where: { id },
    include: {
      course: {
        select: { creatorId: true },
      },
    },
  });

  if (!module) {
    throw new NotFoundError("Module not found");
  }

  if (module.course.creatorId !== userId && !isAdmin(userRole)) {
    throw new ForbiddenError("Not authorized to reorder this module");
  }

  const updatedModule = await prisma.courseModule.update({
    where: { id },
    data: { orderIndex: input.newOrderIndex },
  });

  return { module: updatedModule };
};
