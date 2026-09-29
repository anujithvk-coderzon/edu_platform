import fs from 'fs';
import path from 'path';

export const Upload_Files_Local = async (folder: string, file: Express.Multer.File): Promise<string | null> => {
  try {
    if (!file) return null;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const sanitizedFileName = (file.originalname || 'file')
      .replace(/[^a-zA-Z0-9.\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const fileName = `${Date.now()}-${sanitizedFileName}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file to local storage
    const startTime = Date.now();
    fs.writeFileSync(filePath, file.buffer);
    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log(`💾 Local storage: Saved ${file.originalname} (${fileSizeMB} MB) in ${uploadTime}s`);

    // Return URL for local access
    const baseUrl = process.env.LOCAL_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const fileUrl = `${baseUrl}/uploads/${folder}/${fileName}`;
    console.log(`📁 Local file URL: ${fileUrl}`);

    return fileUrl;
  } catch (error: any) {
    console.error('❌ Local storage error:', error.message);
    return null;
  }
};

export const Delete_File_Local = async (folder: string, fileUrl: string): Promise<boolean> => {
  try {
    if (!fileUrl) return false;

    // Extract filename from URL
    const fileName = path.basename(fileUrl);
    const filePath = path.join(process.cwd(), 'uploads', folder, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted local file: ${fileName}`);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('❌ Local delete error:', error.message);
    return false;
  }
};