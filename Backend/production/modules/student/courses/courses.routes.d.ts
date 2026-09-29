/**
 * Mounted at /api/student — paths unchanged from the previous inline routes.
 * `/courses/categories/all` must stay ahead of `/courses/:id`, or the literal
 * segment would be captured as an id.
 */
declare const router: import("express-serve-static-core").Router;
export default router;
