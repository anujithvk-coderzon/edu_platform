import { Request, Response } from "express";
import { validationResult } from "express-validator";
import prisma from "../DB/DB_Config";
import { AuthRequest } from "../middleware/middleware";

export const GetAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const GetCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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
                avatar: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
                materials: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: { message: "Category not found" },
      });
      return;
    }

    res.json({
      success: true,
      data: { category },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const CreateCategory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        error: { message: "Admin access required" },
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const { name, description } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      res.status(400).json({
        success: false,
        error: { message: "Category already exists" },
      });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
      },
    });

    res.status(201).json({
      success: true,
      data: { category },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const UpdateCategory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        error: { message: "Admin access required" },
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const { id } = req.params;
    const { name, description } = req.body;

    if (name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name,
          NOT: { id },
        },
      });

      if (existingCategory) {
        res.status(400).json({
          success: false,
          error: { message: "Category name already exists" },
        });
        return;
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    res.json({
      success: true,
      data: { category },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { message: "Category not found" },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const DeleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        error: { message: "Admin access required" },
      });
      return;
    }

    const { id } = req.params;

    const coursesCount = await prisma.course.count({
      where: { categoryId: id },
    });

    if (coursesCount > 0) {
      res.status(400).json({
        success: false,
        error: {
          message: "Cannot delete category with associated courses",
        },
      });
      return;
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { message: "Category not found" },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};