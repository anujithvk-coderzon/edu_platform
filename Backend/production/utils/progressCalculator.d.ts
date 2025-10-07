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
export declare function calculateCourseProgress(studentId: string, courseId: string): Promise<ProgressStats>;
/**
 * Calculate progress from pre-fetched counts
 * Use this when you already have the counts to avoid extra queries
 */
export declare function calculateProgressFromCounts(completedMaterials: number, totalMaterials: number, submittedAssignments?: number, totalAssignments?: number): ProgressStats;
/**
 * Update enrollment progress in the database
 */
export declare function updateEnrollmentProgress(studentId: string, courseId: string, progressPercentage: number): Promise<void>;
/**
 * Calculate and update enrollment progress
 * Combines calculation and update in one operation
 */
export declare function recalculateAndUpdateProgress(studentId: string, courseId: string): Promise<ProgressStats>;
