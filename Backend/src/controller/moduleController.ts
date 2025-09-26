import { Request, Response } from "express";
import { validationResult } from "express-validator";
import prisma from "../DB/DB_Config";
import { AuthRequest } from "../middleware/middleware";

export const GetCourseModules = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      res.status(404).json({
        success: false,
        error: { message: "Course not found" },
      });
      return;
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      include: {
        materials: {
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { orderIndex: "asc" },
    });

    res.json({
      success: true,
      data: { modules },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const GetModuleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!module) {
      res.status(404).json({
        success: false,
        error: { message: "Module not found" },
      });
      return;
    }

    res.json({
      success: true,
      data: { module },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const CreateModule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
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

    const { title, description, courseId, orderIndex } = req.body;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      res.status(404).json({
        success: false,
        error: { message: "Course not found" },
      });
      return;
    }

    if (
      course.creatorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        error: { message: "Access denied" },
      });
      return;
    }

    const module = await prisma.courseModule.create({
      data: {
        title,
        description,
        courseId,
        orderIndex: orderIndex || 0,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { module },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const UpdateModule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
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
    const updates = req.body;

    const module = await prisma.courseModule.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!module) {
      res.status(404).json({
        success: false,
        error: { message: "Module not found" },
      });
      return;
    }

    if (
      module.course.creatorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        error: { message: "Access denied" },
      });
      return;
    }

    const updatedModule = await prisma.courseModule.update({
      where: { id },
      data: updates,
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { module: updatedModule },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const DeleteModule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const { id } = req.params;

    const module = await prisma.courseModule.findUnique({
      where: { id },
      include: {
        course: true,
        materials: true,
      },
    });

    if (!module) {
      res.status(404).json({
        success: false,
        error: { message: "Module not found" },
      });
      return;
    }

    if (
      module.course.creatorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        error: { message: "Access denied" },
      });
      return;
    }

    await prisma.courseModule.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const ReorderModule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const { id } = req.params;
    const { newOrderIndex } = req.body;

    const module = await prisma.courseModule.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!module) {
      res.status(404).json({
        success: false,
        error: { message: "Module not found" },
      });
      return;
    }

    if (
      module.course.creatorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        error: { message: "Access denied" },
      });
      return;
    }

    const updatedModule = await prisma.courseModule.update({
      where: { id },
      data: { orderIndex: newOrderIndex },
    });

    res.json({
      success: true,
      data: { module: updatedModule },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};