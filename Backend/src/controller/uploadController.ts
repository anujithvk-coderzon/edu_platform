import { Request, Response } from "express";
import { AuthRequest } from "../middleware/middleware";
import prisma from "../DB/DB_Config";
import { deleteUploadedFile } from "../utils/fileUtils";
import path from "path";
import fs from "fs";

export const UploadSingleFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: "No file uploaded" },
      });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
      },
      message: "File uploaded successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const UploadMultipleFiles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: "No files uploaded" },
      });
      return;
    }

    const uploadedFiles = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
    }));

    res.status(200).json({
      success: true,
      data: { files: uploadedFiles },
      message: "Files uploaded successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const UploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: "No file uploaded" },
      });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    let updatedUser: any;
    if (req.user.role === "admin") {
      const currentUser = await prisma.admin.findUnique({
        where: { id: req.user.id },
      });

      if (currentUser?.avatar) {
        deleteUploadedFile(currentUser.avatar);
      }

      updatedUser = await prisma.admin.update({
        where: { id: req.user.id },
        data: { avatar: fileUrl },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
        },
      });
    } else if (req.user.role === "tutor") {
      const currentUser = await prisma.admin.findUnique({
        where: { id: req.user.id },
      });

      if (currentUser?.avatar) {
        deleteUploadedFile(currentUser.avatar);
      }

      updatedUser = await prisma.admin.update({
        where: { id: req.user.id },
        data: { avatar: fileUrl },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
        file: {
          filename: req.file.filename,
          url: fileUrl,
        },
      },
      message: "Avatar updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const UploadCourseThumbnail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: "No file uploaded" },
      });
      return;
    }

    const { courseId } = req.params;

    if (courseId) {
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

      const currentCourse = await prisma.course.findUnique({
        where: { id: courseId },
        select: { thumbnail: true },
      });

      if (currentCourse?.thumbnail) {
        deleteUploadedFile(currentCourse.thumbnail);
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      await prisma.course.update({
        where: { id: courseId },
        data: { thumbnail: fileUrl },
      });

      res.status(200).json({
        success: true,
        data: {
          courseId,
          thumbnail: fileUrl,
        },
        message: "Course thumbnail updated successfully",
      });
    } else {
      const fileUrl = `/uploads/${req.file.filename}`;

      res.status(200).json({
        success: true,
        data: {
          filename: req.file.filename,
          url: fileUrl,
        },
        message: "Thumbnail uploaded successfully",
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const UploadMaterial = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: "No file uploaded" },
      });
      return;
    }

    const { courseId } = req.params;

    if (courseId) {
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
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
      },
      message: "Material uploaded successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const DeleteUploadedFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const { filename } = req.params;

    if (!filename) {
      res.status(400).json({
        success: false,
        error: { message: "Filename is required" },
      });
      return;
    }

    const filePath = path.join(process.cwd(), "uploads", filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: { message: "File not found" },
      });
      return;
    }

    deleteUploadedFile(`/uploads/${filename}`);

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const GetFileInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const { filename } = req.params;

    if (!filename) {
      res.status(400).json({
        success: false,
        error: { message: "Filename is required" },
      });
      return;
    }

    const filePath = path.join(process.cwd(), "uploads", filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: { message: "File not found" },
      });
      return;
    }

    const stats = fs.statSync(filePath);

    res.status(200).json({
      success: true,
      data: {
        file: {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime,
        }
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};