import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth";
import { BadRequestError, UnauthorizedError } from "../../../errors/Errors";
import { uploadAvatarService } from "./uploads.service";

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Access denied. No token provided.");
  }
  if (!req.file) {
    throw new BadRequestError("No avatar file uploaded");
  }

  const data = await uploadAvatarService(req.user.id, req.file);
  return res.json({
    success: true,
    data,
    message: "Avatar uploaded successfully",
  });
};
