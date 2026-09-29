/**
 * Mounted at /api/student/assignments — paths unchanged.
 * `/upload` is declared before `/:assignmentId/...` so the literal segment is
 * not captured as an id.
 */
declare const router: import("express-serve-static-core").Router;
export default router;
