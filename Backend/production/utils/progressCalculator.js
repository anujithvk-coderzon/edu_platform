"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCourseProgress = calculateCourseProgress;
exports.calculateProgressFromCounts = calculateProgressFromCounts;
exports.updateEnrollmentProgress = updateEnrollmentProgress;
exports.recalculateAndUpdateProgress = recalculateAndUpdateProgress;
const DB_Config_1 = __importDefault(require("../DB/DB_Config"));
/**
 * Calculate progress for a student in a course
 * Progress = (completed materials + submitted assignments) / (total materials + total assignments) * 100
 */
async function calculateCourseProgress(studentId, courseId) {
    // First, get all existing material IDs to filter out deleted materials
    const existingMaterials = await DB_Config_1.default.material.findMany({
        where: { courseId },
        select: { id: true }
    });
    const existingMaterialIds = existingMaterials.map(m => m.id);
    const [totalMaterials, completedMaterials, totalAssignments, submittedAssignments] = await Promise.all([
        Promise.resolve(existingMaterials.length), // Use the materials we already fetched
        DB_Config_1.default.progress.count({
            where: {
                studentId,
                courseId,
                isCompleted: true,
                materialId: { in: existingMaterialIds } // Only count progress for existing materials
            }
        }),
        DB_Config_1.default.assignment.count({ where: { courseId } }),
        DB_Config_1.default.assignmentSubmission.count({
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
function calculateProgressFromCounts(completedMaterials, totalMaterials, submittedAssignments = 0, totalAssignments = 0) {
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
async function updateEnrollmentProgress(studentId, courseId, progressPercentage) {
    await DB_Config_1.default.enrollment.update({
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
                status: 'COMPLETED',
                hasNewContent: false // Clear flag when they complete everything
            })
        }
    });
}
/**
 * Calculate and update enrollment progress
 * Combines calculation and update in one operation
 */
async function recalculateAndUpdateProgress(studentId, courseId) {
    const stats = await calculateCourseProgress(studentId, courseId);
    await updateEnrollmentProgress(studentId, courseId, stats.progressPercentage);
    return stats;
}
