import { Request, Response } from "express";
import { validationResult } from "express-validator";
import prisma from "../DB/DB_Config";
import { AuthRequest } from "../middleware/middleware";
import { MaterialType } from "@prisma/client";
import { deleteUploadedFile } from "../utils/fileUtils";

export const GetCourseMaterials = async (req: Request, res: Response) => {
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

    const materials = await prisma.material.findMany({
      where: { courseId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { module: { orderIndex: "asc" } },
        { orderIndex: "asc" },
      ],
    });

    res.json({
      success: true,
      data: { materials },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const GetMaterialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            creatorId: true,
          },
        },
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!material) {
      res.status(404).json({
        success: false,
        error: { message: "Material not found" },
      });
      return;
    }

    res.json({
      success: true,
      data: { material },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const CreateMaterial = async (req: AuthRequest, res: Response) => {
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

    const {
      title,
      description,
      type,
      content,
      fileUrl,
      orderIndex,
      courseId,
      moduleId,
      isPublic = true,
    } = req.body;

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

    if (moduleId) {
      const module = await prisma.courseModule.findUnique({
        where: { id: moduleId },
      });

      if (!module || module.courseId !== courseId) {
        res.status(400).json({
          success: false,
          error: { message: "Invalid module ID" },
        });
        return;
      }
    }

    const material = await prisma.material.create({
      data: {
        title,
        description,
        type: type as MaterialType,
        content,
        fileUrl,
        orderIndex: orderIndex || 0,
        courseId,
        moduleId: moduleId || null,
        authorId: req.user.id,
        isPublic,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { material },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const UpdateMaterial = async (req: AuthRequest, res: Response) => {
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

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!material) {
      res.status(404).json({
        success: false,
        error: { message: "Material not found" },
      });
      return;
    }

    if (
      material.course.creatorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        error: { message: "Access denied" },
      });
      return;
    }

    const updatedMaterial = await prisma.material.update({
      where: { id },
      data: updates,
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { material: updatedMaterial },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const DeleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!material) {
      res.status(404).json({
        success: false,
        error: { message: "Material not found" },
      });
      return;
    }

    if (
      material.course.creatorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        error: { message: "Access denied" },
      });
      return;
    }

    if (material.fileUrl) {
      deleteUploadedFile(material.fileUrl);
    }

    await prisma.material.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const CompleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const { materialId } = req.params;

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        course: true,
      },
    });

    if (!material) {
      res.status(404).json({
        success: false,
        error: { message: "Material not found" },
      });
      return;
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: material.courseId,
        },
      },
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        error: { message: "Not enrolled in this course" },
      });
      return;
    }

    const existingProgress = await prisma.progress.findFirst({
      where: {
        studentId: req.user.id,
        courseId: material.courseId,
        materialId: materialId,
      },
    });

    if (existingProgress) {
      res.status(400).json({
        success: false,
        error: { message: "Material already completed" },
      });
      return;
    }

    const progress = await prisma.progress.create({
      data: {
        studentId: req.user.id,
        courseId: material.courseId,
        materialId: materialId,
        isCompleted: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { progress },
      message: "Material marked as completed",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};