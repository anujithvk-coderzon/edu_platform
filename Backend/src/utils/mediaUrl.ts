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

import { getVideoEmbedUrl, getVideoPlayerUrl } from './BunnyStream';

/** Fields whose value is a storage path that should be expanded to a URL. */
const STORAGE_PATH_FIELDS = ['thumbnail', 'avatar'] as const;

/** Matches a Bunny Stream video GUID (a plain UUID). */
const VIDEO_GUID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export const isAbsoluteUrl = (value: string): boolean =>
  value.startsWith('http://') || value.startsWith('https://');

export const isVideoGuid = (value: string): boolean =>
  VIDEO_GUID_PATTERN.test(value);

/**
 * Expand a stored storage path into an absolute CDN URL.
 *
 * Values that are already absolute (legacy rows, external links) and video
 * GUIDs are returned untouched — a GUID is not a storage path and must be
 * resolved with `resolveVideoUrls` instead.
 */
export const resolveMediaUrl = (
  value: string | null | undefined
): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (isAbsoluteUrl(trimmed) || isVideoGuid(trimmed)) return trimmed;

  // Legacy local-storage uploads are served by this server, not the CDN.
  if (trimmed.startsWith('/uploads/')) {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    return `${backendUrl.replace(/\/+$/, '')}${trimmed}`;
  }

  const pullZone = process.env.BUNNY_PULL_ZONE_HOST;
  if (!pullZone) {
    console.warn('BUNNY_PULL_ZONE_HOST is not set — returning raw media path');
    return trimmed;
  }

  return `https://${pullZone.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`;
};

/**
 * Reverse of `resolveMediaUrl`: recover the storage path from a value that may
 * have been sent back by a client as an absolute URL. Used when writing, so a
 * round-tripped URL never ends up persisted.
 */
export const toStoragePath = (
  value: string | null | undefined
): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed || !isAbsoluteUrl(trimmed)) return trimmed || null;

  const pullZone = process.env.BUNNY_PULL_ZONE_HOST;
  if (!pullZone) return trimmed;

  const prefix = `https://${pullZone.replace(/\/+$/, '')}/`;
  return trimmed.startsWith(prefix) ? trimmed.slice(prefix.length) : trimmed;
};

/** Stream URLs derived from a video GUID. */
export interface VideoUrls {
  embedUrl: string;
  playUrl: string;
}

export const resolveVideoUrls = (guid: string): VideoUrls => ({
  embedUrl: getVideoEmbedUrl(guid),
  playUrl: getVideoPlayerUrl(guid),
});

/**
 * Resolve a material's `fileUrl` in place and, for videos, attach the Stream
 * URLs alongside it.
 *
 * `fileUrl` deliberately keeps the raw GUID for video materials: clients built
 * before this change still derive their own embed URL from it, so replacing it
 * would break them mid-rollout. New clients read `embedUrl` / `playUrl`.
 */
const resolveMaterialFileUrl = (material: Record<string, any>): void => {
  const fileUrl: unknown = material.fileUrl;
  if (typeof fileUrl !== 'string' || !fileUrl.trim()) return;

  const value = fileUrl.trim();
  const isVideo =
    String(material.type ?? '').toUpperCase() === 'VIDEO' || isVideoGuid(value);

  if (isVideo && isVideoGuid(value)) {
    const { embedUrl, playUrl } = resolveVideoUrls(value);
    material.embedUrl = embedUrl;
    material.playUrl = playUrl;
    return;
  }

  material.fileUrl = resolveMediaUrl(value);
};

/**
 * Walk a response payload and expand every media field it contains.
 *
 * Handles arbitrarily nested shapes (course.materials[].fileUrl,
 * enrollment.course.thumbnail, …) so controllers can pass whatever they were
 * about to send to `res.json` straight through.
 */
export const withMediaUrls = <T>(payload: T, seen = new WeakSet<object>()): T => {
  if (payload === null || typeof payload !== 'object') return payload;

  if (Array.isArray(payload)) {
    return payload.map((item) => withMediaUrls(item, seen)) as unknown as T;
  }

  if (payload instanceof Date) return payload;

  // Guard against circular references in Prisma results
  if (seen.has(payload as object)) return payload;
  seen.add(payload as object);

  const record = payload as Record<string, any>;

  for (const field of STORAGE_PATH_FIELDS) {
    if (typeof record[field] === 'string') {
      record[field] = resolveMediaUrl(record[field]);
    }
  }

  if ('fileUrl' in record) {
    resolveMaterialFileUrl(record);
  }

  for (const key of Object.keys(record)) {
    const value = record[key];
    if (value !== null && typeof value === 'object') {
      record[key] = withMediaUrls(value, seen);
    }
  }

  return payload;
};
