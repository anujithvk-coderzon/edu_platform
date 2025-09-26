import { Request, Response } from "express";
import { validationResult } from "express-validator";
import prisma from "../DB/DB_Config";
import { AuthRequest } from "../middleware/middleware";
import { CourseStatus, MaterialType, EnrollmentStatus } from "@prisma/client";
import { deleteUploadedFile, deleteMultipleFiles } from "../utils/fileUtils";

export const GetAllCourses = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const category = req.query.category as string;
    const level = req.query.level as string;
    const search = req.query.search as string;
    const status = req.query.status as CourseStatus;
    const skip = (page - 1) * limit;

    const where: any = {
      status: status || CourseStatus.PUBLISHED,
      isPublic: true,
    };

    if (category) {
      where.category = { name: { contains: category, mode: "insensitive" } };
    }

    if (level) {
      where.level = { contains: level, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
              materials: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.course.count({ where }),
    ]);

    const coursesWithAvgRating = await Promise.all(
      courses.map(async (course) => {
        const avgRating = await prisma.review.aggregate({
          where: { courseId: course.id },
          _avg: { rating: true },
        });

        return {
          ...course,
          averageRating: avgRating._avg.rating || 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        courses: coursesWithAvgRating,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const GetMyCourses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause: any = {};

    if (userRole === "admin") {
      whereClause = {};
    } else if (userRole === "tutor") {
      whereClause = {
        creatorId: userId,
      };
    } else {
      whereClause = { creatorId: userId };
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            materials: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: { courses },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const GetCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        modules: {
          include: {
            materials: {
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                fileUrl: true,
                content: true,
                orderIndex: true,
                isPublic: true,
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
        reviews: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            enrollments: true,
            materials: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      res.status(404).json({
        success: false,
        error: { message: "Course not found" },
      });
      return;
    }

    const avgRating = await prisma.review.aggregate({
      where: { courseId: course.id },
      _avg: { rating: true },
    });

    let isEnrolled = false;

    res.json({
      success: true,
      data: {
        course: {
          ...course,
          averageRating: avgRating._avg.rating || 0,
          isEnrolled,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const CreateCourse = async (req: AuthRequest, res: Response) => {
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
      price = 0,
      duration,
      level,
      categoryId,
      thumbnail,
      tutorName,
      objectives = [],
      requirements = [],
      tags = [],
    } = req.body;

    // Validate category exists
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        res.status(400).json({
          success: false,
          error: { message: "Invalid category ID" },
        });
        return;
      }
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        duration: duration ? parseInt(duration) : null,
        level,
        categoryId,
        thumbnail,
        tutorName:
          tutorName || `${req.user.firstName} ${req.user.lastName}`,
        creatorId: req.user.id,
        status: CourseStatus.DRAFT,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { course },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const UpdateCourse = async (req: AuthRequest, res: Response) => {
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

    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      res.status(404).json({
        success: false,
        error: { message: "Course not found" },
      });
      return;
    }

    if (
      existingCourse.creatorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        error: { message: "Access denied" },
      });
      return;
    }

    delete updates.creatorId;

    const course = await prisma.course.update({
      where: { id },
      data: updates,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { course },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const PublishCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
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

    if (course.status === CourseStatus.PUBLISHED) {
      res.status(400).json({
        success: false,
        error: { message: "Course is already published" },
      });
      return;
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        status: CourseStatus.PUBLISHED,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        course: updatedCourse,
        message: "Course published successfully!",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const DeleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        materials: true,
      },
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

    const filesToDelete: string[] = [];
    if (course.thumbnail) filesToDelete.push(course.thumbnail);

    course.materials.forEach((material) => {
      if (material.fileUrl) filesToDelete.push(material.fileUrl);
    });

    await prisma.course.delete({
      where: { id },
    });

    if (filesToDelete.length > 0) {
      deleteMultipleFiles(filesToDelete);
    }

    res.json({
      success: true,
      message: "Course and all associated files deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};