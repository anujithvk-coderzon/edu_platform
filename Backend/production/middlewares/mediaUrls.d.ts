/**
 * Media URL boundary middleware.
 *
 * The database is the source of truth for RELATIVE storage paths; clients are
 * served absolute URLs. Rather than touching every controller (media fields
 * leave the API from ~40 response sites across three controllers), the
 * translation happens once, at the HTTP boundary:
 *
 *   incoming  →  normalizeMediaPaths   →  controller writes a relative path
 *   outgoing  ←  resolveMediaUrls      ←  controller returns a relative path
 *
 * This keeps `Delete_File` and `deleteVideoFromBunnyStream` working — both
 * require a bare path / bare GUID and would silently fail against an absolute
 * URL — and means a CDN or storage-zone change never requires a data migration
 * or a frontend rebuild.
 */
import express from 'express';
/**
 * Expand relative media paths in every JSON response into absolute URLs.
 *
 * Wraps `res.json` so it applies to existing and future endpoints alike.
 */
export declare const resolveMediaUrls: (_req: express.Request, res: express.Response, next: express.NextFunction) => void;
/**
 * Collapse absolute CDN URLs in request bodies back to storage paths.
 *
 * Without this, a client that reads a course and writes it straight back — the
 * admin course-edit form does exactly this with an unchanged thumbnail — would
 * persist the absolute URL it was served, breaking every delete path.
 *
 * Only this deployment's own CDN prefix is stripped: external URLs (YouTube
 * LINK materials, Google OAuth avatars) and Bunny Stream GUIDs pass through
 * untouched.
 */
export declare const normalizeMediaPaths: (req: express.Request, _res: express.Response, next: express.NextFunction) => void;
