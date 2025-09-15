/**
 * Get the full URL for an uploaded image
 * @param imagePath - The relative path from the API (e.g., "/uploads/image.jpg")
 * @returns Full URL to the image
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a relative path, prepend the API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return `${apiUrl}${imagePath}`;
};