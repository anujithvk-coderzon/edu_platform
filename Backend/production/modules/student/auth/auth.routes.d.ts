/**
 * Mounted at /api/student/auth — the paths below match the previous routes
 * exactly, so no client change is required.
 *
 * Validation lives in auth.validation.ts (zod), not here; routes only map a
 * path to middleware and a controller.
 */
declare const router: import("express-serve-static-core").Router;
export default router;
