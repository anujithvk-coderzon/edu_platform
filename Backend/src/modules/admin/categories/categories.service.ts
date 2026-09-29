import prisma from "../../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../../errors/Errors";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./categories.validation";

/** Every Prisma call and rule for admin category management lives here. */

export const listCategoriesService = async () => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { courses: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return { categories };
};

export const getCategoryByIdService = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      courses: {
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { enrollments: true },
          },
        },
      },
      _count: {
        select: { courses: true },
      },
    },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  return { category };
};

export const createCategoryService = async (input: CreateCategoryInput) => {
  // `name` is unique in the schema; the explicit lookup keeps the original
  // 400 + message instead of surfacing a Prisma P2002.
  const existingCategory = await prisma.category.findUnique({
    where: { name: input.name },
  });

  if (existingCategory) {
    throw new BadRequestError("Category with this name already exists");
  }

  const category = await prisma.category.create({
    data: { name: input.name, description: input.description },
  });

  return { category };
};

export const updateCategoryService = async (
  id: string,
  input: UpdateCategoryInput,
) => {
  // Only keys actually sent are written, exactly as the legacy handler did:
  // an empty `name` is ignored, a `description` of "" is not.
  const updates: { name?: string; description?: string } = {};
  if (input.name) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;

  if (input.name) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: input.name,
        NOT: { id },
      },
    });

    if (existingCategory) {
      throw new BadRequestError("Category with this name already exists");
    }
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Category not found");
  }

  const category = await prisma.category.update({
    where: { id },
    data: updates,
  });

  return { category };
};

export const deleteCategoryService = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  if (category._count.courses > 0) {
    throw new BadRequestError("Cannot delete category with existing courses");
  }

  await prisma.category.delete({
    where: { id },
  });
};
