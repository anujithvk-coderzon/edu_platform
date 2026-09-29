/**
 * Bunny Stream Video Upload Utilities
 *
 * This module handles video uploads to Bunny Stream service in two steps:
 * 1. Create video metadata (returns GUID)
 * 2. Upload video file using the GUID
 */
interface BunnyVideoMetadata {
    guid: string;
    videoLibraryId: number;
    title: string;
    dateUploaded: string;
    views: number;
    isPublic: boolean;
    length: number;
    status: number;
    framerate: number;
    width: number;
    height: number;
    availableResolutions: string;
    thumbnailCount: number;
    encodeProgress: number;
    storageSize: number;
    captions: any[];
    hasMP4Fallback: boolean;
    collectionId: string;
    thumbnailFileName: string;
    averageWatchTime: number;
    totalWatchTime: number;
    category: string;
    chapters: any[];
    moments: any[];
    metaTags: any[];
    transcodingMessages: any[];
}
/**
 * Step 1: Create video metadata in Bunny Stream
 * This creates a placeholder for the video and returns a GUID
 *
 * @param title - The title of the video
 * @returns The video GUID and full metadata
 */
export declare const createVideoMetadata: (title: string) => Promise<{
    guid: string;
    metadata: BunnyVideoMetadata;
} | null>;
/**
 * Step 2: Upload video file to Bunny Stream using the GUID
 *
 * @param guid - The video GUID obtained from createVideoMetadata
 * @param file - The video file buffer from multer
 * @returns True if upload successful, false otherwise
 */
export declare const uploadVideoToBunnyStream: (guid: string, file: Express.Multer.File) => Promise<boolean>;
/**
 * Complete video upload process (metadata creation + file upload)
 * This is a convenience function that combines both steps
 *
 * @param title - The title of the video
 * @param file - The video file buffer from multer
 * @returns The video GUID if successful, null otherwise
 */
export declare const uploadVideoComplete: (title: string, file: Express.Multer.File) => Promise<string | null>;
/**
 * Check if a file is a video based on mimetype
 *
 * @param mimetype - The mimetype of the file
 * @returns True if the file is a video
 */
export declare const isVideoFile: (mimetype: string) => boolean;
/**
 * Get video embed URL from GUID
 *
 * @param guid - The video GUID
 * @returns The embed URL
 */
export declare const getVideoEmbedUrl: (guid: string) => string;
/**
 * Get video player URL from GUID
 *
 * @param guid - The video GUID
 * @returns The player URL
 */
export declare const getVideoPlayerUrl: (guid: string) => string;
/**
 * Delete video from Bunny Stream
 *
 * @param guid - The video GUID to delete
 * @returns True if deletion successful, false otherwise
 */
export declare const deleteVideoFromBunnyStream: (guid: string) => Promise<boolean>;
export {};
