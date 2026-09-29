import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit to handle larger audio/video files
  },
  fileFilter: (req, file, cb) => {
    // Log file details for debugging
    console.log(`📁 Multer processing file: ${file.originalname} (${file.mimetype})`);

    // Check for audio files specifically
    if (file.mimetype.startsWith('audio/')) {
      console.log(`🎵 Audio file detected: ${file.originalname}`);
    }

    cb(null, true); // allow all file types
  },
});

// Assignment-specific multer configuration with file type restrictions
export const assignmentUpload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB for assignments
  },
  fileFilter: (req, file, cb) => {
    console.log(`📋 Assignment file processing: ${file.originalname} (${file.mimetype})`);

    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'application/zip'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed for assignments`));
    }
  },
});

// Different upload helpers
export const upload_single = upload.single("file");
export const upload_multiple = upload.array("files", 10);
export const upload_avatar = upload.single("avatar");
export const upload_thumbnail = upload.single("thumbnail");
export const upload_material = upload.single("material");
export const upload_assignment = assignmentUpload.single("file");
