import { getCdnUrl } from './cdn';

/**
 * Get the full URL for an uploaded image
 * @param imagePath - The relative path from the API (e.g., "images/filename.jpg") or full URL
 * @returns Full URL to the image
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  return getCdnUrl(imagePath);
};