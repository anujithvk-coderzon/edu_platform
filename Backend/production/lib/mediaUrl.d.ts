/**
 * Media URL resolution.
 *
 * The database stores RELATIVE storage paths (`images/123-foo.jpeg`,
 * `materials/123-doc.pdf`, `avatars/...`) and, for video materials, a Bunny
 * Stream GUID. Paths stay relative in the database so that changing CDN or
 * storage zone never requires a data migration — resolution happens here, on
 * the way out of the API, so clients never need CDN configuration of their own.
 *
 * Rule: paths in the database, absolute URLs on the wire.
 */
export declare const isAbsoluteUrl: (value: string) => boolean;
export declare const isVideoGuid: (value: string) => boolean;
/**
 * Expand a stored storage path into an absolute CDN URL.
 *
 * Values that are already absolute (legacy rows, external links) and video
 * GUIDs are returned untouched — a GUID is not a storage path and must be
 * resolved with `resolveVideoUrls` instead.
 */
export declare const resolveMediaUrl: (value: string | null | undefined) => string | null;
/**
 * Reverse of `resolveMediaUrl`: recover the storage path from a value that may
 * have been sent back by a client as an absolute URL. Used when writing, so a
 * round-tripped URL never ends up persisted.
 */
export declare const toStoragePath: (value: string | null | undefined) => string | null;
/** Stream URLs derived from a video GUID. */
export interface VideoUrls {
    embedUrl: string;
    playUrl: string;
}
export declare const resolveVideoUrls: (guid: string) => VideoUrls;
/**
 * Walk a response payload and expand every media field it contains.
 *
 * Handles arbitrarily nested shapes (course.materials[].fileUrl,
 * enrollment.course.thumbnail, …) so controllers can pass whatever they were
 * about to send to `res.json` straight through.
 */
export declare const withMediaUrls: <T>(payload: T, seen?: WeakSet<object>) => T;
