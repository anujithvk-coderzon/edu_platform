/** The staff member performing the upload: an Admin or a Tutor. */
export interface Caller {
    id: string;
    role?: "Admin" | "Tutor";
}
/**
 * Legacy disk-backed responses.
 *
 * Multer is configured with `memoryStorage`, so `filename` and `path` are
 * undefined on the incoming file. That is pre-existing behaviour of these two
 * endpoints and the shape below reproduces it verbatim — the admin UI reads
 * `url` and `originalName` only.
 */
export declare const uploadSingleFileService: (file: Express.Multer.File) => Promise<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    path: string;
}>;
export declare const uploadMultipleFilesService: (files: Express.Multer.File[]) => Promise<{
    files: {
        filename: string;
        originalName: string;
        mimetype: string;
        size: number;
        url: string;
        path: string;
    }[];
}>;
/**
 * Course thumbnail upload.
 *
 * The file always lands on the CDN first; only then is the optional
 * `courseId` resolved, so an upload with no course attached still returns a
 * usable `url` for the create-course form to hold on to.
 */
export declare const uploadCourseThumbnailService: (caller: Caller, file: Express.Multer.File, courseId?: string) => Promise<{
    filename: string;
    url: string;
    message?: undefined;
} | {
    filename: string;
    url: string;
    message: string;
}>;
/**
 * Course material upload.
 *
 * Two destinations, and which one is used decides what `fileUrl` means:
 *
 *  - videos go to Bunny Stream and `fileUrl` is the bare video GUID (no
 *    scheme, no slashes) — the player resolves it later,
 *  - everything else goes to Bunny CDN Storage and `fileUrl` is a bare
 *    relative path (`materials/...`).
 *
 * `fileUrl` and `url` carry the same value on purpose: the create-course page
 * reads `.fileUrl` while the course-edit page reads `.url`, so both keys have
 * to stay.
 */
export declare const uploadMaterialService: (caller: Caller, file: Express.Multer.File, courseId?: string) => Promise<{
    message: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    fileUrl: string;
    url: string;
    isVideo: boolean;
}>;
/** Removes a file from the legacy on-disk upload directory. */
export declare const deleteUploadedFileService: (filename: string) => Promise<void>;
/** Stats for a file in the legacy on-disk upload directory. */
export declare const getFileInfoService: (filename: string) => Promise<{
    filename: string;
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    extension: string;
    url: string;
}>;
/**
 * Admin avatar upload.
 *
 * The previous avatar is read *before* the new one is uploaded, and only
 * removed once the replacement is safely on the CDN — a failed delete never
 * fails the upload. The stored value is the bare relative CDN path that
 * Delete_File needs, so it is passed through untouched.
 */
export declare const uploadAdminAvatarService: (adminId: string, file: Express.Multer.File) => Promise<{
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        avatar: string;
        updatedAt: Date;
    };
    url: string;
}>;
