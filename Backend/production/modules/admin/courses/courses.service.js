"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOrphanedCoursesService = exports.deleteCourseService = exports.listPendingCoursesService = exports.getPendingCoursesCountService = exports.rejectCourseService = exports.publishCourseService = exports.submitCourseForReviewService = exports.updateCourseService = exports.createCourseService = exports.getCourseByIdService = exports.toggleTutorStatusService = exports.listTutorsService = exports.listMyCoursesService = exports.listAllCoursesService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const client_1 = require("../../../generated/prisma/client");
const email_1 = require("../../../lib/email");
const cdnStorage_1 = require("../../../lib/cdnStorage");
const bunnyStream_1 = require("../../../lib/bunnyStream");
const isAdmin = (userRole) => userRole === "Admin";
/**
 * Deletes a course plus its CDN files and Bunny Stream videos, but refuses if
 * anybody is enrolled. Never throws — it reports success as a boolean, because
 * the cleanup job walks a list and must keep going after a failure.
 */
const safeDeleteCourse = async (courseId, reason) => {
    try {
        console.log(`🗑️ Attempting to delete course ${courseId}${reason ? ` - Reason: ${reason}` : ""}`);
        // Get course details first
        const course = await prisma_1.default.course.findUnique({
            where: { id: courseId },
            include: {
                materials: true,
                modules: true,
                assignments: true,
                enrollments: true,
            },
        });
        if (!course) {
            console.log(`❌ Course ${courseId} not found for deletion`);
            return false;
        }
        // Check if course has enrollments - if yes, don't delete for safety
        if (course.enrollments.length > 0) {
            console.log(`⚠️ Course ${courseId} has ${course.enrollments.length} enrollments, skipping deletion for safety`);
            return false;
        }
        // Delete associated CDN files and Bunny Stream videos
        for (const material of course.materials) {
            if (material.fileUrl && material.type !== client_1.MaterialType.LINK) {
                try {
                    if (material.type === client_1.MaterialType.VIDEO) {
                        // For VIDEO materials, delete from Bunny Stream — `fileUrl` holds
                        // the bare GUID, never a URL.
                        const guid = material.fileUrl;
                        const deleted = await (0, bunnyStream_1.deleteVideoFromBunnyStream)(guid);
                        if (deleted) {
                            console.log(`✅ Deleted video from Bunny Stream: ${guid}`);
                        }
                        else {
                            console.error(`⚠️ Failed to delete video from Bunny Stream: ${guid}`);
                        }
                    }
                    else {
                        // For other materials, delete from Bunny Storage
                        await (0, cdnStorage_1.Delete_File)(material.fileUrl);
                        console.log(`✅ Deleted material file from Bunny Storage: ${material.fileUrl}`);
                    }
                }
                catch (error) {
                    console.error(`❌ Failed to delete material file ${material.fileUrl}:`, error);
                }
            }
        }
        // Delete thumbnail from CDN
        if (course.thumbnail) {
            try {
                await (0, cdnStorage_1.Delete_File)(course.thumbnail);
                console.log(`✅ Deleted course thumbnail: ${course.thumbnail}`);
            }
            catch (error) {
                console.error(`❌ Failed to delete course thumbnail ${course.thumbnail}:`, error);
            }
        }
        // Delete the course (cascade will handle related records)
        await prisma_1.default.course.delete({
            where: { id: courseId },
        });
        console.log(`✅ Successfully deleted course ${courseId}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Error deleting course ${courseId}:`, error);
        return false;
    }
};
const listAllCoursesService = async (query) => {
    const { page, limit, category, level, search, status } = query;
    const skip = (page - 1) * limit;
    const where = {
        status: status || client_1.CourseStatus.PUBLISHED,
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
        prisma_1.default.course.findMany({
            where,
            include: {
                creator: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
                category: {
                    select: { id: true, name: true },
                },
                _count: {
                    select: { enrollments: true, reviews: true, materials: true },
                },
            },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.default.course.count({ where }),
    ]);
    const coursesWithAvgRating = await Promise.all(courses.map(async (course) => {
        const avgRating = await prisma_1.default.review.aggregate({
            where: { courseId: course.id },
            _avg: { rating: true },
        });
        return {
            ...course,
            averageRating: avgRating._avg.rating || 0,
        };
    }));
    return {
        courses: coursesWithAvgRating,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};
exports.listAllCoursesService = listAllCoursesService;
const listMyCoursesService = async (query, userId, userRole) => {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;
    let whereClause = {};
    if (userRole === "Admin") {
        // Admin has complete access - can see ALL courses regardless of creator/tutor
        whereClause = {};
    }
    else if (userRole === "Tutor") {
        // Tutor can ONLY see:
        // 1. Courses they created (creatorId = their ID)
        // 2. Courses assigned to them by admin (tutorId = their ID)
        whereClause = {
            OR: [
                { creatorId: userId }, // Courses they created
                { tutorId: userId }, // Courses assigned to them by admin
            ],
        };
    }
    else {
        // Other roles (like students) can only see courses they created (if any)
        whereClause = { creatorId: userId };
    }
    // Add search filter (ensure we preserve existing OR conditions for tutors)
    if (search) {
        const searchCondition = {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ],
        };
        // If there's already an OR condition (for tutors), combine them with AND
        if (whereClause.OR) {
            whereClause = {
                AND: [{ OR: whereClause.OR }, searchCondition],
            };
        }
        else {
            whereClause = { ...whereClause, ...searchCondition };
        }
    }
    // Add status filter
    if (status && status !== "ALL") {
        whereClause.status = status;
    }
    // Get total count and courses with pagination
    const [totalCourses, courses] = await Promise.all([
        prisma_1.default.course.count({ where: whereClause }),
        prisma_1.default.course.findMany({
            where: whereClause,
            include: {
                category: {
                    select: { id: true, name: true },
                },
                creator: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                tutor: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                _count: {
                    select: { enrollments: true, materials: true, reviews: true },
                },
            },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
    ]);
    // Calculate average rating and get accurate enrollment counts for each course
    const coursesWithRatings = await Promise.all(courses.map(async (course) => {
        const [avgRating, totalEnrollments] = await Promise.all([
            prisma_1.default.review.aggregate({
                where: { courseId: course.id },
                _avg: { rating: true },
            }),
            // Get accurate count of ALL enrollments from database
            prisma_1.default.enrollment.count({
                where: { courseId: course.id },
            }),
        ]);
        return {
            ...course,
            averageRating: avgRating._avg.rating || null,
            // Override the _count with accurate database count
            _count: {
                ...course._count,
                enrollments: totalEnrollments, // All enrollments from DB
            },
        };
    }));
    const totalPages = Math.ceil(totalCourses / limit);
    return {
        courses: coursesWithRatings,
        pagination: {
            total: totalCourses,
            pages: totalPages,
            totalPages,
            currentPage: page,
            limit,
        },
    };
};
exports.listMyCoursesService = listMyCoursesService;
const listTutorsService = async (query, userType, userRole) => {
    // Only admins can get all tutors
    if (userType !== "admin" || !isAdmin(userRole)) {
        throw new Errors_1.ForbiddenError("Access denied");
    }
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;
    // Build where clause
    const whereClause = { role: "Tutor" };
    // Add status filter
    if (status === "active") {
        whereClause.isActive = true;
    }
    else if (status === "inactive") {
        whereClause.isActive = false;
    }
    // Add search filter
    if (search) {
        whereClause.OR = [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }
    // Get total count for pagination
    const total = await prisma_1.default.admin.count({ where: whereClause });
    // Get tutors with pagination
    const tutors = await prisma_1.default.admin.findMany({
        where: whereClause,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isActive: true,
            createdAt: true,
            createdCourses: { select: { id: true } },
            assignedCourses: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
    });
    // Count unique courses (avoid double counting when tutor is both creator and assigned)
    const tutorsWithTotalCourses = tutors.map((tutor) => {
        const createdIds = new Set(tutor.createdCourses.map((c) => c.id));
        const assignedIds = new Set(tutor.assignedCourses.map((c) => c.id));
        const uniqueCourseIds = new Set([...createdIds, ...assignedIds]);
        return {
            id: tutor.id,
            email: tutor.email,
            firstName: tutor.firstName,
            lastName: tutor.lastName,
            avatar: tutor.avatar,
            isActive: tutor.isActive,
            createdAt: tutor.createdAt,
            _count: {
                createdCourses: uniqueCourseIds.size,
            },
        };
    });
    return {
        tutors: tutorsWithTotalCourses,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
        },
    };
};
exports.listTutorsService = listTutorsService;
const toggleTutorStatusService = async (id, input, userType, userRole) => {
    // Only admins can toggle tutor status
    if (userType !== "admin" || !isAdmin(userRole)) {
        throw new Errors_1.ForbiddenError("Only admins can modify tutor status");
    }
    const { isActive } = input;
    // Check if tutor exists
    const tutor = await prisma_1.default.admin.findUnique({
        where: { id, role: "Tutor" },
    });
    if (!tutor) {
        throw new Errors_1.NotFoundError("Tutor not found");
    }
    // Update tutor status
    const updatedTutor = await prisma_1.default.admin.update({
        where: { id },
        data: { isActive },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
        },
    });
    // Note: Welcome emails are only sent during initial account creation
    // or when accepting tutor registration requests, not when toggling status
    return {
        tutor: updatedTutor,
        message: `Tutor ${isActive ? "activated" : "deactivated"} successfully`,
    };
};
exports.toggleTutorStatusService = toggleTutorStatusService;
const getCourseByIdService = async (id, userId, userRole) => {
    // First check if course exists
    const course = await prisma_1.default.course.findUnique({
        where: { id },
        include: {
            creator: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            tutor: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            category: {
                select: { id: true, name: true },
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
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            _count: {
                select: { enrollments: true, materials: true, reviews: true },
            },
        },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    // Access control: Tutors can only access courses they created or are assigned to
    if (userRole === "Tutor") {
        const hasAccess = course.creatorId === userId || course.tutorId === userId;
        if (!hasAccess) {
            throw new Errors_1.ForbiddenError("Access denied. You can only view courses you created or are assigned to.");
        }
    }
    // Admins have access to all courses (no additional check needed)
    const avgRating = await prisma_1.default.review.aggregate({
        where: { courseId: course.id },
        _avg: { rating: true },
    });
    // The original handler looked the caller up as a student here; an admin id
    // simply never matches, so this stays false for staff. Kept as-is.
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: {
            studentId_courseId: { studentId: userId, courseId: course.id },
        },
    });
    const isEnrolled = !!enrollment;
    return {
        course: {
            ...course,
            averageRating: avgRating._avg.rating || 0,
            isEnrolled,
        },
    };
};
exports.getCourseByIdService = getCourseByIdService;
const createCourseService = async (input, creator) => {
    const { title, description, price, duration, level, categoryId, thumbnail, tutorName, tutorId, prerequisites, requirements, } = input;
    // If tutorId is provided, verify it's a valid tutor and get their name
    let assignedTutorName = null;
    if (tutorId) {
        const tutor = await prisma_1.default.admin.findUnique({
            where: { id: tutorId },
        });
        if (!tutor || tutor.role !== "Tutor") {
            throw new Errors_1.BadRequestError("Invalid tutor ID");
        }
        assignedTutorName = `${tutor.firstName} ${tutor.lastName}`;
    }
    // Use a transaction to ensure atomicity
    const course = await prisma_1.default.$transaction(async (tx) => {
        // Create the course within the transaction
        const newCourse = await tx.course.create({
            data: {
                title,
                description,
                price,
                duration: duration ? duration : null,
                level,
                ...(categoryId && { categoryId }),
                thumbnail,
                tutorName: tutorName ||
                    assignedTutorName ||
                    `${creator.firstName} ${creator.lastName}`,
                creatorId: creator.id,
                ...(tutorId && { tutorId }), // Save the assigned tutor ID
                status: client_1.CourseStatus.DRAFT,
                requirements,
                prerequisites,
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
                tutor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        email: true,
                    },
                },
                category: {
                    select: { id: true, name: true },
                },
            },
        });
        // If the course creation fails, the transaction will automatically rollback
        return newCourse;
    });
    return { course };
};
exports.createCourseService = createCourseService;
const updateCourseService = async (id, input, userId, userRole) => {
    const updates = {};
    const { title, description, price, duration, level, categoryId, thumbnail, tutorName, tutorId, status, isPublic, requirements, prerequisites, } = input;
    if (title)
        updates.title = title;
    if (description)
        updates.description = description;
    if (price !== undefined)
        updates.price = price;
    if (duration)
        updates.duration = duration;
    if (level)
        updates.level = level;
    if (categoryId)
        updates.categoryId = categoryId;
    if (thumbnail)
        updates.thumbnail = thumbnail;
    if (tutorName)
        updates.tutorName = tutorName;
    if (tutorId !== undefined)
        updates.tutorId = tutorId;
    if (status)
        updates.status = status;
    if (typeof isPublic === "boolean")
        updates.isPublic = isPublic;
    if (requirements !== undefined)
        updates.requirements = requirements;
    if (prerequisites !== undefined)
        updates.prerequisites = prerequisites;
    // If tutorId is provided, verify it's a valid tutor and set tutorName automatically
    if (tutorId) {
        const tutor = await prisma_1.default.admin.findUnique({
            where: { id: tutorId },
        });
        if (!tutor || tutor.role !== "Tutor") {
            throw new Errors_1.BadRequestError("Invalid tutor ID");
        }
        // Automatically set tutorName to the assigned tutor's name if not explicitly provided
        if (!tutorName) {
            updates.tutorName = `${tutor.firstName} ${tutor.lastName}`;
        }
    }
    const existingCourse = await prisma_1.default.course.findUnique({
        where: { id },
    });
    if (!existingCourse) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    // Access control: Admin can edit any course, Tutors can only edit courses they created or are assigned to
    if (!isAdmin(userRole)) {
        const hasAccess = existingCourse.creatorId === userId || existingCourse.tutorId === userId;
        if (!hasAccess) {
            throw new Errors_1.ForbiddenError("Access denied. You can only edit courses you created or are assigned to.");
        }
    }
    const course = await prisma_1.default.course.update({
        where: { id },
        data: updates,
        include: {
            creator: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            category: {
                select: { id: true, name: true },
            },
        },
    });
    return { course };
};
exports.updateCourseService = updateCourseService;
/** Tutor submits course for admin review. */
const submitCourseForReviewService = async (id, userId) => {
    const course = await prisma_1.default.course.findUnique({
        where: { id },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    // Only course creator or assigned tutor can submit for review
    const hasAccess = course.creatorId === userId || course.tutorId === userId;
    if (!hasAccess) {
        throw new Errors_1.ForbiddenError("Not authorized to submit this course");
    }
    if (course.status !== client_1.CourseStatus.DRAFT &&
        course.status !== client_1.CourseStatus.REJECTED) {
        throw new Errors_1.BadRequestError("Only draft or rejected courses can be submitted for review");
    }
    const updatedCourse = await prisma_1.default.course.update({
        where: { id },
        data: {
            status: client_1.CourseStatus.PENDING_REVIEW,
            rejectionReason: null, // Clear rejection reason when resubmitting
            rejectedAt: null,
        },
        include: {
            creator: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            category: {
                select: { id: true, name: true },
            },
        },
    });
    return {
        course: updatedCourse,
        message: "Course submitted for review successfully!",
    };
};
exports.submitCourseForReviewService = submitCourseForReviewService;
/** Admin-only: Publish course (approve). */
const publishCourseService = async (id, userRole) => {
    // Only admins can publish courses
    if (!isAdmin(userRole)) {
        throw new Errors_1.ForbiddenError("Only admins can publish courses");
    }
    const course = await prisma_1.default.course.findUnique({
        where: { id },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    if (course.status === client_1.CourseStatus.PUBLISHED) {
        throw new Errors_1.BadRequestError("Course is already published");
    }
    const updatedCourse = await prisma_1.default.course.update({
        where: { id },
        data: {
            status: client_1.CourseStatus.PUBLISHED,
            isPublic: true,
            rejectionReason: null, // Clear any previous rejection reason
            rejectedAt: null,
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
            tutor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    email: true,
                },
            },
            category: {
                select: { id: true, name: true },
            },
            _count: {
                select: { enrollments: true, materials: true, reviews: true },
            },
        },
    });
    // Send email notification to course creator/tutor about publication
    const recipientEmail = updatedCourse.tutor?.email || updatedCourse.creator.email;
    const recipientName = updatedCourse.tutor
        ? `${updatedCourse.tutor.firstName} ${updatedCourse.tutor.lastName}`
        : `${updatedCourse.creator.firstName} ${updatedCourse.creator.lastName}`;
    await (0, email_1.sendCoursePublishedEmail)(recipientEmail, recipientName, updatedCourse.title);
    return {
        course: updatedCourse,
        message: "Course published successfully! Notification email has been sent.",
    };
};
exports.publishCourseService = publishCourseService;
/** Admin-only: Reject course. */
const rejectCourseService = async (id, input, userRole) => {
    const { reason } = input; // Optional rejection reason
    // Only admins can reject courses
    if (!isAdmin(userRole)) {
        throw new Errors_1.ForbiddenError("Only admins can reject courses");
    }
    const course = await prisma_1.default.course.findUnique({
        where: { id },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    if (course.status !== client_1.CourseStatus.PENDING_REVIEW) {
        throw new Errors_1.BadRequestError("Only pending courses can be rejected");
    }
    // Set course to REJECTED status
    const updatedCourse = await prisma_1.default.course.update({
        where: { id },
        data: {
            status: client_1.CourseStatus.REJECTED,
            isPublic: false,
            rejectionReason: reason || "No reason provided",
            rejectedAt: new Date(),
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
            tutor: {
                select: { id: true, firstName: true, lastName: true, email: true },
            },
        },
    });
    // Send email notification to course creator/tutor with rejection reason
    const recipientEmail = updatedCourse.tutor?.email || updatedCourse.creator.email;
    const recipientName = updatedCourse.tutor
        ? `${updatedCourse.tutor.firstName} ${updatedCourse.tutor.lastName}`
        : `${updatedCourse.creator.firstName} ${updatedCourse.creator.lastName}`;
    await (0, email_1.sendCourseRejectionEmail)(recipientEmail, recipientName, updatedCourse.title, reason || "No reason provided");
    return {
        course: updatedCourse,
        message: "Course rejected successfully. Notification email has been sent.",
    };
};
exports.rejectCourseService = rejectCourseService;
/** Admin-only: Get pending courses count. */
const getPendingCoursesCountService = async (userRole) => {
    // Only admins can view pending courses count
    if (!isAdmin(userRole)) {
        throw new Errors_1.ForbiddenError("Only admins can view pending courses");
    }
    const count = await prisma_1.default.course.count({
        where: { status: client_1.CourseStatus.PENDING_REVIEW },
    });
    return { count };
};
exports.getPendingCoursesCountService = getPendingCoursesCountService;
/** Admin-only: Get all pending courses. */
const listPendingCoursesService = async (userRole) => {
    // Only admins can view pending courses
    if (!isAdmin(userRole)) {
        throw new Errors_1.ForbiddenError("Only admins can view pending courses");
    }
    const courses = await prisma_1.default.course.findMany({
        where: { status: client_1.CourseStatus.PENDING_REVIEW },
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
            tutor: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            category: {
                select: { id: true, name: true },
            },
            _count: {
                select: { enrollments: true, materials: true, modules: true },
            },
        },
        orderBy: { updatedAt: "desc" },
    });
    return { courses };
};
exports.listPendingCoursesService = listPendingCoursesService;
const deleteCourseService = async (id, userId, userRole) => {
    const course = await prisma_1.default.course.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            thumbnail: true, // Explicitly select thumbnail for deletion
            creatorId: true,
            tutorId: true, // Add tutorId for access control
            materials: {
                select: { id: true, fileUrl: true, type: true },
            },
            assignments: {
                select: {
                    id: true,
                    title: true,
                    submissions: {
                        select: { id: true, fileUrl: true, studentId: true },
                    },
                },
            },
            enrollments: {
                select: { id: true, status: true, progressPercentage: true },
            },
            _count: {
                select: { enrollments: true },
            },
        },
    });
    if (!course) {
        throw new Errors_1.NotFoundError("Course not found");
    }
    // Access control: Admin can delete any course, Tutors can delete courses they created or are assigned to
    if (!isAdmin(userRole)) {
        const hasAccess = course.creatorId === userId || course.tutorId === userId;
        if (!hasAccess) {
            throw new Errors_1.ForbiddenError("Not authorized to delete this course");
        }
    }
    // Check for active enrollments (not completed)
    const activeEnrollments = course.enrollments.filter((enrollment) => enrollment.status !== client_1.EnrollmentStatus.COMPLETED &&
        enrollment.progressPercentage < 100);
    if (activeEnrollments.length > 0) {
        throw new Errors_1.BadRequestError(`Cannot delete course with ${activeEnrollments.length} active enrollment(s). Wait for students to complete the course or manually mark enrollments as completed.`);
    }
    // Delete all associated material files from CDN and Bunny Stream
    const materials = course.materials.filter((material) => material.fileUrl && material.type !== "LINK");
    let deletedMaterialsCount = 0;
    for (const material of materials) {
        try {
            if (material.type === client_1.MaterialType.VIDEO) {
                // For VIDEO materials, delete from Bunny Stream using GUID
                const guid = material.fileUrl;
                console.log(`🎬 Deleting video from Bunny Stream: ${guid}`);
                const deleted = await (0, bunnyStream_1.deleteVideoFromBunnyStream)(guid);
                if (deleted) {
                    deletedMaterialsCount++;
                    console.log(`✅ Deleted video from Bunny Stream: ${guid}`);
                }
                else {
                    console.log(`⚠️ Failed to delete video from Bunny Stream: ${guid}`);
                }
            }
            else {
                // For other materials (PDF, DOCUMENT, IMAGE), delete from Bunny Storage
                const fileUrl = material.fileUrl;
                const deleted = await (0, cdnStorage_1.Delete_File)(fileUrl);
                if (deleted) {
                    deletedMaterialsCount++;
                    console.log(`✅ Deleted material from Bunny Storage: ${fileUrl}`);
                }
                else {
                    console.log(`⚠️ Failed to delete material from Bunny Storage: ${fileUrl}`);
                }
            }
        }
        catch (err) {
            console.error(`❌ Error deleting material (${material.type}): ${material.fileUrl}`, err);
        }
    }
    console.log(`🗑️ Deleted ${deletedMaterialsCount}/${materials.length} material files for course: ${course.title}`);
    // Delete all assignment submission files from CDN
    let deletedSubmissionsCount = 0;
    let totalSubmissionFiles = 0;
    for (const assignment of course.assignments) {
        const submissionFiles = assignment.submissions.filter((sub) => sub.fileUrl);
        totalSubmissionFiles += submissionFiles.length;
        for (const submission of submissionFiles) {
            if (submission.fileUrl) {
                try {
                    // fileUrl should already be in format "folder/filename"
                    const deleted = await (0, cdnStorage_1.Delete_File)(submission.fileUrl);
                    if (deleted) {
                        deletedSubmissionsCount++;
                        console.log(`✅ Deleted assignment submission: ${submission.fileUrl}`);
                    }
                    else {
                        console.log(`⚠️ Failed to delete submission: ${submission.fileUrl}`);
                    }
                }
                catch (err) {
                    console.error(`❌ Error deleting submission file: ${submission.fileUrl}`, err);
                }
            }
        }
    }
    if (totalSubmissionFiles > 0) {
        console.log(`📄 Deleted ${deletedSubmissionsCount}/${totalSubmissionFiles} assignment submission files`);
    }
    // Delete course thumbnail from CDN if it exists
    if (course.thumbnail) {
        try {
            // thumbnail should already be in format "folder/filename"
            const thumbnailDeleted = await (0, cdnStorage_1.Delete_File)(course.thumbnail);
            if (thumbnailDeleted) {
                console.log(`🖼️ Successfully deleted thumbnail: ${course.thumbnail}`);
            }
            else {
                console.log(`⚠️ Failed to delete thumbnail: ${course.thumbnail}`);
            }
        }
        catch (err) {
            console.error(`❌ Error deleting thumbnail: ${course.thumbnail}`, err);
        }
    }
    else {
        console.log(`📝 No thumbnail to delete for course: ${course.title}`);
    }
    // Now delete the course from database (this will cascade delete related records)
    await prisma_1.default.course.delete({
        where: { id },
    });
    const deletionSummary = {
        courseName: course.title,
        deletedMaterials: `${deletedMaterialsCount}/${materials.length}`,
        deletedSubmissions: `${deletedSubmissionsCount}/${totalSubmissionFiles}`,
        thumbnailDeleted: course.thumbnail ? "Yes" : "N/A",
    };
    console.log("📊 Course deletion summary:", deletionSummary);
    return deletionSummary;
};
exports.deleteCourseService = deleteCourseService;
const cleanupOrphanedCoursesService = async () => {
    // The original handler reported cleanup failures with its own message,
    // so an unexpected error is re-thrown as that exact 500 rather than the
    // generic one the error handler would produce.
    try {
        // Find courses that might be orphaned:
        // 1. DRAFT status with no materials and created more than 1 hour ago
        // 2. DRAFT status with no thumbnail and created more than 1 hour ago
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const potentialOrphans = await prisma_1.default.course.findMany({
            where: {
                AND: [
                    { status: client_1.CourseStatus.DRAFT },
                    { createdAt: { lt: oneHourAgo } },
                    {
                        OR: [
                            { materials: { none: {} } }, // No materials
                            { thumbnail: null }, // No thumbnail
                            { thumbnail: "" }, // Empty thumbnail
                        ],
                    },
                ],
            },
            include: {
                materials: true,
                enrollments: true,
                _count: {
                    select: { materials: true, enrollments: true },
                },
            },
        });
        const cleanupResults = [];
        let deletedCount = 0;
        let skippedCount = 0;
        for (const course of potentialOrphans) {
            const reason = [];
            if (course._count.materials === 0) {
                reason.push("no materials");
            }
            if (!course.thumbnail) {
                reason.push("no thumbnail");
            }
            if (course._count.enrollments > 0) {
                skippedCount++;
                cleanupResults.push({
                    courseId: course.id,
                    title: course.title,
                    status: "skipped",
                    reason: "Has enrollments - too dangerous to delete",
                });
                continue;
            }
            const deleted = await safeDeleteCourse(course.id, reason.join(", "));
            if (deleted) {
                deletedCount++;
                cleanupResults.push({
                    courseId: course.id,
                    title: course.title,
                    status: "deleted",
                    reason: reason.join(", "),
                });
            }
            else {
                skippedCount++;
                cleanupResults.push({
                    courseId: course.id,
                    title: course.title,
                    status: "failed",
                    reason: "Deletion failed",
                });
            }
        }
        return {
            data: {
                summary: {
                    totalFound: potentialOrphans.length,
                    deleted: deletedCount,
                    skipped: skippedCount,
                },
                details: cleanupResults,
            },
            message: `Cleanup completed: ${deletedCount} courses deleted, ${skippedCount} skipped`,
        };
    }
    catch (error) {
        console.error("CleanupOrphanedCourses error:", error);
        throw new Errors_1.InternalServerError("Internal server error during cleanup");
    }
};
exports.cleanupOrphanedCoursesService = cleanupOrphanedCoursesService;
