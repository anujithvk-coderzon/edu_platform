/**
 * Mounted at /api/admin (not under a /courses prefix) — several of these are
 * siblings of the course paths, so the full paths are declared here.
 *
 * Every literal segment under /courses has to be declared before
 * "/courses/:id", or ":id" captures "my-courses", "pending" and "cleanup".
 */
declare const router: import("express-serve-static-core").Router;
export default router;
