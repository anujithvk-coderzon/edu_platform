"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unblockStudentService = exports.blockStudentService = exports.deleteUserService = exports.updateUserService = exports.getUserByIdService = exports.getAllStudentsService = exports.getStudentStatsService = exports.getUserStatsService = exports.listRegisteredStudentsService = exports.getStudentsCountService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const Errors_1 = require("../../../errors/Errors");
const getStudentsCountService = async () => {
    const studentsCount = await prisma_1.default.student.count();
    return { studentsCount };
};
exports.getStudentsCountService = getStudentsCountService;
const listRegisteredStudentsService = async (query) => {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;
    const whereClause = {};
    // "active" means enabled *and* not blocked; "blocked" ignores isActive.
    if (status === "active") {
        whereClause.isActive = true;
        whereClause.blocked = false;
    }
    else if (status === "blocked") {
        whereClause.blocked = true;
    }
    if (search) {
        whereClause.OR = [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }
    const total = await prisma_1.default.student.count({ where: whereClause });
    // Straight off the Student table — these are registrations, not enrolments.
    const students = await prisma_1.default.student.findMany({
        where: whereClause,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            country: true,
            city: true,
            education: true,
            institution: true,
            occupation: true,
            company: true,
            isVerified: true,
            isActive: true,
            blocked: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: "desc",
        },
        skip,
        take: limit,
    });
    // Dates are serialised here (not left to JSON.stringify) and createdAt /
    // updatedAt are renamed to registeredAt / lastActive for the admin table.
    const formattedStudents = students.map((student) => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        avatar: student.avatar,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString() : null,
        gender: student.gender,
        country: student.country,
        city: student.city,
        education: student.education,
        institution: student.institution,
        occupation: student.occupation,
        company: student.company,
        isVerified: student.isVerified,
        isActive: student.isActive,
        blocked: student.blocked,
        registeredAt: student.createdAt.toISOString(),
        lastActive: student.updatedAt.toISOString(),
    }));
    return {
        students: formattedStudents,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
        },
    };
};
exports.listRegisteredStudentsService = listRegisteredStudentsService;
/** Dashboard counters for the Admin table (admins, not students). */
const getUserStatsService = async () => {
    const [totalUsers, totalAdmins, totalCourses, totalEnrollments, recentUsers] = await Promise.all([
        prisma_1.default.admin.count(),
        prisma_1.default.admin.count({ where: { role: "Admin" } }),
        prisma_1.default.course.count(),
        prisma_1.default.enrollment.count(), // Count ALL enrollments
        prisma_1.default.admin.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                createdAt: true,
            },
        }),
    ]);
    return {
        stats: {
            totalUsers,
            totalAdmins,
            totalCourses,
            totalEnrollments,
        },
        recentUsers,
    };
};
exports.getUserStatsService = getUserStatsService;
/** Counters for the Student table, with progress averaged over enrolments. */
const getStudentStatsService = async () => {
    // Get current date for time-based calculations
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const [totalStudents, activeEnrollments, newStudentsThisMonth, allEnrollments] = await Promise.all([
        // Total students in database
        prisma_1.default.student.count(),
        // Students with at least one ACTIVE enrollment
        prisma_1.default.student.count({
            where: {
                enrollments: {
                    some: {
                        status: "ACTIVE",
                    },
                },
            },
        }),
        // Students who registered in the last month
        prisma_1.default.student.count({
            where: {
                createdAt: {
                    gte: oneMonthAgo,
                },
            },
        }),
        // Get all enrollments with progress for average calculation
        prisma_1.default.enrollment.findMany({
            select: {
                progressPercentage: true,
            },
        }),
    ]);
    // Calculate average progress across all enrollments
    const averageProgress = allEnrollments.length > 0
        ? allEnrollments.reduce((sum, e) => sum + e.progressPercentage, 0) /
            allEnrollments.length
        : 0;
    return {
        stats: {
            totalStudents, // Total students from Student table
            activeStudents: activeEnrollments, // Students with ACTIVE enrollments
            newThisMonth: newStudentsThisMonth, // New registrations this month
            averageProgress, // Average progress across all enrollments
            totalRevenue: 0, // No payment system yet
        },
    };
};
exports.getStudentStatsService = getStudentStatsService;
/**
 * The admin "Students" screen: every student of every course the caller can
 * see, with per-enrolment material and assignment detail.
 *
 * Admins see all courses; tutors see only courses they created or are
 * assigned to.
 */
const getAllStudentsService = async (adminId, userRole) => {
    let courseIds = [];
    if (userRole === "Admin") {
        // Admins see all courses - get all course IDs
        const allCourses = await prisma_1.default.course.findMany({
            select: { id: true },
        });
        courseIds = allCourses.map((course) => course.id);
    }
    else {
        // Tutors see only their courses
        const tutorCourses = await prisma_1.default.course.findMany({
            where: {
                OR: [
                    { creatorId: adminId }, // Courses they created
                    { tutorId: adminId }, // Courses assigned to them as tutor
                ],
            },
            select: { id: true },
        });
        courseIds = tutorCourses.map((course) => course.id);
    }
    // No visible courses means no students — and an empty `in` would match all.
    if (courseIds.length === 0) {
        return {
            students: [],
            stats: {
                totalStudents: 0,
                activeStudents: 0,
                newThisMonth: 0,
                averageProgress: 0,
                topPerformers: 0,
                totalRevenue: 0,
            },
        };
    }
    const enrollments = await prisma_1.default.enrollment.findMany({
        where: {
            courseId: { in: courseIds },
        },
        include: {
            student: true,
            course: {
                include: {
                    _count: {
                        select: {
                            materials: true,
                            assignments: true,
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
                    tutor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
    // Group enrollments by student
    const studentMap = new Map();
    enrollments.forEach((enrollment) => {
        const studentId = enrollment.student.id;
        if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
                id: enrollment.student.id,
                firstName: enrollment.student.firstName,
                lastName: enrollment.student.lastName,
                email: enrollment.student.email,
                avatar: enrollment.student.avatar,
                isVerified: enrollment.student.isVerified,
                isActive: enrollment.student.isActive,
                blocked: enrollment.student.blocked || false,
                joinedAt: enrollment.student.createdAt.toISOString(),
                lastActive: enrollment.student.updatedAt.toISOString(),
                enrollments: [],
                totalCourses: 0,
                completedCourses: 0,
                totalSpentHours: 0,
                totalMaterials: 0,
                completedMaterials: 0,
                totalAssignments: 0,
                submittedAssignments: 0,
                gradedAssignments: 0,
            });
        }
        const student = studentMap.get(studentId);
        student.enrollments.push({
            courseId: enrollment.courseId,
            courseTitle: enrollment.course.title,
            enrolledAt: enrollment.enrolledAt.toISOString(),
            status: enrollment.status,
            progressPercentage: enrollment.progressPercentage,
            totalMaterials: enrollment.course._count.materials,
            totalAssignments: enrollment.course._count.assignments,
            completedMaterials: 0, // Will be calculated later
            submittedAssignments: 0, // Will be calculated later
            gradedAssignments: 0, // Will be calculated later
            completedMaterialsList: [], // Will be populated later
            submittedAssignmentsList: [], // Will be populated later
            creator: enrollment.course.creator
                ? {
                    id: enrollment.course.creator.id,
                    firstName: enrollment.course.creator.firstName,
                    lastName: enrollment.course.creator.lastName,
                    email: enrollment.course.creator.email,
                }
                : null,
            tutor: enrollment.course.tutor
                ? {
                    id: enrollment.course.tutor.id,
                    firstName: enrollment.course.tutor.firstName,
                    lastName: enrollment.course.tutor.lastName,
                    email: enrollment.course.tutor.email,
                }
                : null,
        });
        student.totalMaterials += enrollment.course._count.materials;
        student.totalAssignments += enrollment.course._count.assignments;
    });
    // Calculate additional statistics for each student
    const students = await Promise.all(Array.from(studentMap.values()).map(async (student) => {
        // Calculate actual time spent from Progress records
        const progressRecords = await prisma_1.default.progress.findMany({
            where: {
                studentId: student.id,
                courseId: { in: student.enrollments.map((e) => e.courseId) },
            },
        });
        const totalMinutes = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
        student.totalSpentHours = Math.round(totalMinutes / 60); // Convert minutes to hours
        student.totalCourses = student.enrollments.length;
        student.completedCourses = student.enrollments.filter((e) => e.status === "COMPLETED").length;
        // Calculate detailed progress for each enrollment
        for (const enrollment of student.enrollments) {
            // Get all existing materials for this course (to filter out deleted ones)
            const existingMaterials = await prisma_1.default.material.findMany({
                where: { courseId: enrollment.courseId },
                select: { id: true },
            });
            const existingMaterialIds = existingMaterials.map((m) => m.id);
            // Get completed materials for this specific course (only for existing materials)
            const completedProgressData = await prisma_1.default.progress.findMany({
                where: {
                    studentId: student.id,
                    courseId: enrollment.courseId,
                    isCompleted: true,
                    materialId: {
                        not: null,
                        in: existingMaterialIds, // Only count progress for materials that still exist
                    },
                },
                orderBy: {
                    lastAccessed: "desc",
                },
            });
            // Get material details for completed materials
            const materialIds = completedProgressData
                .map((p) => p.materialId)
                .filter(Boolean);
            const materials = await prisma_1.default.material.findMany({
                where: {
                    id: { in: materialIds },
                },
                include: {
                    module: {
                        select: {
                            id: true,
                            title: true,
                            orderIndex: true,
                        },
                    },
                },
            });
            // Create a map for quick material lookup
            const materialMap = new Map(materials.map((m) => [m.id, m]));
            enrollment.completedMaterials = completedProgressData.length; // Now only counts existing materials
            enrollment.completedMaterialsList = completedProgressData.map((progress) => {
                const material = materialMap.get(progress.materialId);
                return {
                    id: material?.id || "",
                    title: material?.title || "",
                    type: material?.type || "",
                    completedAt: progress.lastAccessed.toISOString(),
                    chapter: material?.module
                        ? {
                            id: material.module.id,
                            title: material.module.title,
                            orderIndex: material.module.orderIndex,
                        }
                        : null,
                };
            });
            // Get submitted assignments for this specific course
            const submittedAssignmentsData = await prisma_1.default.assignmentSubmission.findMany({
                where: {
                    studentId: student.id,
                    assignment: {
                        courseId: enrollment.courseId,
                    },
                },
                include: {
                    assignment: {
                        select: {
                            id: true,
                            title: true,
                            maxScore: true,
                        },
                    },
                },
                orderBy: {
                    submittedAt: "desc",
                },
            });
            enrollment.submittedAssignments = submittedAssignmentsData.length;
            enrollment.gradedAssignments = submittedAssignmentsData.filter((sub) => sub.score !== null).length;
            enrollment.submittedAssignmentsList = submittedAssignmentsData.map((submission) => ({
                id: submission.id,
                assignmentId: submission.assignment.id,
                title: submission.assignment.title,
                submittedAt: submission.submittedAt.toISOString(),
                status: submission.score !== null ? "GRADED" : "SUBMITTED",
                score: submission.score,
                maxScore: submission.assignment.maxScore,
            }));
        }
        // Calculate overall totals (only for materials that still exist)
        // Get all existing material IDs across all enrolled courses
        const allCourseIds = student.enrollments.map((e) => e.courseId);
        const allExistingMaterials = await prisma_1.default.material.findMany({
            where: { courseId: { in: allCourseIds } },
            select: { id: true },
        });
        const allExistingMaterialIds = allExistingMaterials.map((m) => m.id);
        const completedMaterials = await prisma_1.default.progress.count({
            where: {
                studentId: student.id,
                courseId: { in: allCourseIds },
                isCompleted: true,
                materialId: { in: allExistingMaterialIds }, // Only count existing materials
            },
        });
        const submittedAssignments = await prisma_1.default.assignmentSubmission.count({
            where: {
                studentId: student.id,
                assignment: {
                    courseId: { in: student.enrollments.map((e) => e.courseId) },
                },
            },
        });
        const gradedAssignments = await prisma_1.default.assignmentSubmission.count({
            where: {
                studentId: student.id,
                assignment: {
                    courseId: { in: student.enrollments.map((e) => e.courseId) },
                },
                score: { not: null },
            },
        });
        student.completedMaterials = completedMaterials;
        student.submittedAssignments = submittedAssignments;
        student.gradedAssignments = gradedAssignments;
        return student;
    }));
    // Calculate statistics
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.enrollments.some((e) => e.status === "ACTIVE")).length;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newThisMonth = students.filter((s) => new Date(s.joinedAt) > oneMonthAgo).length;
    const totalProgress = students.reduce((sum, s) => sum +
        s.enrollments.reduce((enrollmentSum, e) => enrollmentSum + e.progressPercentage, 0), 0);
    const totalEnrollments = students.reduce((sum, s) => sum + s.enrollments.length, 0);
    const averageProgress = totalEnrollments > 0 ? totalProgress / totalEnrollments : 0;
    const topPerformers = students.filter((s) => s.enrollments.some((e) => e.progressPercentage > 80)).length;
    const stats = {
        totalStudents,
        activeStudents,
        newThisMonth,
        averageProgress: Math.round(averageProgress),
        topPerformers,
        totalRevenue: 0, // No payment system implemented yet
    };
    return { students, stats };
};
exports.getAllStudentsService = getAllStudentsService;
/** `:id` here is an Admin record id — the route name is historical. */
const getUserByIdService = async (id) => {
    const user = await prisma_1.default.admin.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    createdCourses: true,
                    materials: true,
                    assignments: true,
                },
            },
        },
    });
    if (!user) {
        throw new Errors_1.NotFoundError("User not found");
    }
    return { user };
};
exports.getUserByIdService = getUserByIdService;
const updateUserService = async (id, input) => {
    // Only the keys actually supplied are written, so a partial update never
    // blanks a field.
    const updates = {};
    if (input.firstName)
        updates.firstName = input.firstName;
    if (input.lastName)
        updates.lastName = input.lastName;
    if (input.role)
        updates.role = input.role;
    if (typeof input.isActive === "boolean")
        updates.isActive = input.isActive;
    if (typeof input.isVerified === "boolean")
        updates.isVerified = input.isVerified;
    const existing = await prisma_1.default.admin.findUnique({
        where: { id },
        select: { id: true },
    });
    if (!existing) {
        throw new Errors_1.NotFoundError("User not found");
    }
    const user = await prisma_1.default.admin.update({
        where: { id },
        data: updates,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            isVerified: true,
            isActive: true,
            updatedAt: true,
        },
    });
    return { user };
};
exports.updateUserService = updateUserService;
const deleteUserService = async (id, callerId) => {
    // Guards against an admin locking themselves out.
    if (id === callerId) {
        throw new Errors_1.BadRequestError("Cannot delete your own account");
    }
    const existing = await prisma_1.default.admin.findUnique({
        where: { id },
        select: { id: true },
    });
    if (!existing) {
        throw new Errors_1.NotFoundError("User not found");
    }
    await prisma_1.default.admin.delete({
        where: { id },
    });
};
exports.deleteUserService = deleteUserService;
const blockStudentService = async (studentId, adminId, userRole) => {
    // Only admins can block students
    if (userRole !== "Admin") {
        throw new Errors_1.ForbiddenError("Only administrators can block students");
    }
    const student = await prisma_1.default.student.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            blocked: true,
        },
    });
    if (!student) {
        throw new Errors_1.NotFoundError("Student not found");
    }
    if (student.blocked) {
        throw new Errors_1.BadRequestError("Student is already blocked");
    }
    // Block the student and clear their session
    const updatedStudent = await prisma_1.default.student.update({
        where: { id: studentId },
        data: {
            blocked: true,
            activeSessionToken: null, // Force logout
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            blocked: true,
        },
    });
    console.log("✅ Student blocked:", {
        studentId: updatedStudent.id,
        email: updatedStudent.email,
        blockedBy: adminId,
        timestamp: new Date().toISOString(),
    });
    return {
        data: { student: updatedStudent },
        message: `${updatedStudent.firstName} ${updatedStudent.lastName} has been blocked successfully`,
    };
};
exports.blockStudentService = blockStudentService;
const unblockStudentService = async (studentId, adminId, userRole) => {
    // Only admins can unblock students
    if (userRole !== "Admin") {
        throw new Errors_1.ForbiddenError("Only administrators can unblock students");
    }
    const student = await prisma_1.default.student.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            blocked: true,
        },
    });
    if (!student) {
        throw new Errors_1.NotFoundError("Student not found");
    }
    if (!student.blocked) {
        throw new Errors_1.BadRequestError("Student is not blocked");
    }
    const updatedStudent = await prisma_1.default.student.update({
        where: { id: studentId },
        data: { blocked: false },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            blocked: true,
        },
    });
    console.log("✅ Student unblocked:", {
        studentId: updatedStudent.id,
        email: updatedStudent.email,
        unblockedBy: adminId,
        timestamp: new Date().toISOString(),
    });
    return {
        data: { student: updatedStudent },
        message: `${updatedStudent.firstName} ${updatedStudent.lastName} has been unblocked successfully`,
    };
};
exports.unblockStudentService = unblockStudentService;
