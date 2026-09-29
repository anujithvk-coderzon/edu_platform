import type { Request, Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { UnauthorizedError } from "../../../errors/Errors";
import {
  createCategoryService,
  deleteCategoryService,
  getCategoryByIdService,
  listCategoriesService,
  updateCategoryService,
} from "./categories.service";
import {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from "./categories.validation";

/**
 * HTTP only: parse, call a service, shape the response. No Prisma, no
 * try/catch — Express 5 forwards throws to errorHandler.
 */

const adminId = (req: AuthRequest): string => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  return req.user.id;
};

/** Public: the category list feeds the course catalogue filters. */
export const getAllCategories = async (_req: Request, res: Response) => {
  const data = await listCategoriesService();
  return res.json({ success: true, data });
};

/** Public: a single category with its courses. */
export const getCategoryById = async (req: Request, res: Response) => {
  const data = await getCategoryByIdService(req.params.id as string);
  return res.json({ success: true, data });
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  adminId(req);

  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await createCategoryService(parsed.data);
  return res.status(201).json({ success: true, data });
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  adminId(req);

  const params = categoryIdParamSchema.safeParse(req.params);
  if (!params.success) throw params.error;

  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await updateCategoryService(params.data.id, parsed.data);
  return res.json({ success: true, data });
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  adminId(req);

  await deleteCategoryService(req.params.id as string);
  return res.json({
    success: true,
    message: "Category deleted successfully",
  });
};
