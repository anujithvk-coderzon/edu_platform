import prisma from '../DB/DB_Config';

/**
 * Centralized progress calculation utility
 * Ensures consistent progress calculation across all endpoints
 */

export interface ProgressStats {
  totalMaterials: number;
  completedMaterials: number;
  totalAssignments: number;
  submittedAssignments: number;
  totalItems: number;
  completedItems: number;
  progressPercentage: number;
}

/**
 * Calculate progress for a student in a course
 * Progress = (completed materials + submitted assignments) / (total materials + total assignments) * 100
 */
export async function calculateCourseProgress(
  studentId: string,
  courseId: string
): Promise<ProgressStats> {
  const [totalMaterials, completedMaterials, totalAssignments, submittedAssignments] = await Promise.all([
    prisma.material.count({ where: { courseId } }),
    prisma.progress.count({
      where: {
        studentId,
        courseId,
        isCompleted: true
      }
    }),
    prisma.assignment.count({ where: { courseId } }),
    prisma.assignmentSubmission.count({
      where: {
        studentId,
        assignment: { courseId }
      }
    })
  ]);

  const totalItems = totalMaterials + totalAssignments;
  const completedItems = completedMaterials + submittedAssignments;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    totalMaterials,
    completedMaterials,
    totalAssignments,
    submittedAssignments,
    totalItems,
    completedItems,
    progressPercentage
  };
}

/**
 * Calculate progress from pre-fetched counts
 * Use this when you already have the counts to avoid extra queries
 */
export function calculateProgressFromCounts(
  completedMaterials: number,
  totalMaterials: number,
  submittedAssignments: number = 0,
  totalAssignments: number = 0
): ProgressStats {
  const totalItems = totalMaterials + totalAssignments;
  const completedItems = completedMaterials + submittedAssignments;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    totalMaterials,
    completedMaterials,
    totalAssignments,
    submittedAssignments,
    totalItems,
    completedItems,
    progressPercentage
  };
}

/**
 * Update enrollment progress in the database
 */
export async function updateEnrollmentProgress(
  studentId: string,
  courseId: string,
  progressPercentage: number
): Promise<void> {
  await prisma.enrollment.update({
    where: {
      studentId_courseId: {
        studentId,
        courseId
      }
    },
    data: {
      progressPercentage,
      ...(progressPercentage === 100 && {
        completedAt: new Date(),
        status: 'COMPLETED'
      })
    }
  });
}

/**
 * Calculate and update enrollment progress
 * Combines calculation and update in one operation
 */
export async function recalculateAndUpdateProgress(
  studentId: string,
  courseId: string
): Promise<ProgressStats> {
  const stats = await calculateCourseProgress(studentId, courseId);
  await updateEnrollmentProgress(studentId, courseId, stats.progressPercentage);
  return stats;
}
