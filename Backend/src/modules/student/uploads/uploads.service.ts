import prisma from "../../../lib/prisma";
import { InternalServerError } from "../../../errors/Errors";
import { Upload_Files, Delete_File } from "../../../lib/cdnStorage";
import { Upload_Files_Local } from "../../../lib/localStorage";

export const uploadAvatarService = async (
  studentId: string,
  file: Express.Multer.File,
) => {
  const current = await prisma.student.findUnique({
    where: { id: studentId },
    select: { avatar: true },
  });

  const useLocal =
    process.env.NODE_ENV === "development" || !process.env.BUNNY_API_KEY;

  const avatarUrl = useLocal
    ? await Upload_Files_Local("avatars", file)
    : await Upload_Files("avatars", file);

  // Remove the previous avatar, but never fail the upload over it.
  if (current?.avatar) {
    try {
      await Delete_File(current.avatar);
    } catch (error) {
      console.error("❌ Error deleting old avatar:", error);
    }
  }

  if (!avatarUrl) {
    throw new InternalServerError("Failed to upload avatar to storage");
  }

  const student = await prisma.student.update({
    where: { id: studentId },
    data: { avatar: avatarUrl },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      updatedAt: true,
    },
  });

  return { url: avatarUrl, user: student };
};
