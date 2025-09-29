/**
 * Utility functions for CDN URL construction
 */

import { env } from '../config/env';

const CDN_HOST = env.CDN_HOST;

/**
 * Constructs a full CDN URL from a relative path
 * @param path - The relative path stored in the database (e.g., "images/filename.jpg")
 * @returns The full CDN URL or the original path if it's already a full URL
 */
export function getCdnUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // If it's already a full URL, return as is (for backward compatibility)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Construct the full CDN URL
  return `https://${CDN_HOST}/${path}`;
}

/**
 * Extracts the relative path from a full CDN URL
 * @param url - The full CDN URL
 * @returns The relative path or the original URL if it's not a CDN URL
 */
export function extractCdnPath(url: string): string {
  if (!url) return url;

  const cdnPrefix = `https://${CDN_HOST}/`;
  if (url.startsWith(cdnPrefix)) {
    return url.substring(cdnPrefix.length);
  }

  return url;
}