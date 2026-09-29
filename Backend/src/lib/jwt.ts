import jwt from "jsonwebtoken";

/**
 * Session JWTs.
 *
 * `sessionToken` carries the single-active-session id: authMiddleware compares
 * it against `student.activeSessionToken`, so issuing a new one logs the
 * previous device out.
 */
export const generateStudentToken = (
  studentId: string,
  sessionToken: string,
): string =>
  jwt.sign(
    { id: studentId, type: "student", sessionToken },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions,
  );

/** Admin/tutor session token. Staff sessions are not single-device. */
export const generateAdminToken = (
  userId: string,
  type: "admin" | "student" = "admin",
): string =>
  jwt.sign({ id: userId, type }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);

export interface StudentTokenPayload {
  id: string;
  type: string;
  sessionToken?: string;
}

/** Verify a student session JWT. Returns null instead of throwing. */
export const verifyStudentToken = (
  token: string,
): StudentTokenPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as StudentTokenPayload;
    return decoded?.type === "student" ? decoded : null;
  } catch {
    return null;
  }
};

/** Cookie options for the session cookie, matching existing behaviour. */
export const sessionCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};
