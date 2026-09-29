import fs from 'fs';
import path from 'path';

export const deleteUploadedFile = (fileUrl: string): boolean => {
  try {
    if (!fileUrl) return false;
    
    // Extract filename from URL (e.g., '/uploads/filename.mp4' -> 'filename.mp4')
    const filename = path.basename(fileUrl);
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, filename);
    
    // Check if file exists and delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ File deleted: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️ File not found, skipping deletion: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return false;
  }
};

export const deleteMultipleFiles = (fileUrls: string[]): number => {
  let deletedCount = 0;
  
  for (const fileUrl of fileUrls) {
    if (deleteUploadedFile(fileUrl)) {
      deletedCount++;
    }
  }
  
  return deletedCount;
};