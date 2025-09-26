import { Request, Response } from "express";
import prisma from "../DB/DB_Config";
import { AuthRequest } from "../middleware/middleware";
import { CourseStatus } from "@prisma/client";

export const GetTutorAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const userId = req.user.id;

    const courses = await prisma.course.findMany({
      where: {
        creatorId: userId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            materials: true,
            reviews: true,
          },
        },
      },
    });

    const totalStudents = await prisma.enrollment.count({
      where: {
        course: {
          creatorId: userId,
        },
      },
    });

    const totalRevenue = courses.reduce(
      (sum, course) => sum + course.price * course._count.enrollments,
      0
    );

    const analytics = {
      totalCourses: courses.length,
      totalStudents,
      totalRevenue,
      courseBreakdown: {
        published: courses.filter((c) => c.status === CourseStatus.PUBLISHED)
          .length,
        draft: courses.filter((c) => c.status === CourseStatus.DRAFT).length,
        archived: courses.filter((c) => c.status === CourseStatus.ARCHIVED)
          .length,
      },
      recentCourses: courses
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    };

    res.json({
      success: true,
      data: { analytics },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};

export const GetCourseCompletion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

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

    const totalMaterials = await prisma.material.count({
      where: { courseId },
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const completionData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const completedMaterials = await prisma.progress.count({
          where: {
            studentId: enrollment.studentId,
            courseId: courseId,
            isCompleted: true,
          },
        });

        const completionPercentage =
          totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;

        return {
          student: enrollment.student,
          enrolledAt: enrollment.enrolledAt,
          completedMaterials,
          totalMaterials,
          completionPercentage: Math.round(completionPercentage),
        };
      })
    );

    const averageCompletion =
      completionData.length > 0
        ? completionData.reduce((sum, data) => sum + data.completionPercentage, 0) /
          completionData.length
        : 0;

    res.json({
      success: true,
      data: {
        courseId,
        courseTitle: course.title,
        totalStudents: enrollments.length,
        totalMaterials,
        averageCompletion: Math.round(averageCompletion),
        studentProgress: completionData,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server error", details: error.message },
    });
  }
};