/**
 * Session JWTs.
 *
 * `sessionToken` carries the single-active-session id: authMiddleware compares
 * it against `student.activeSessionToken`, so issuing a new one logs the
 * previous device out.
 */
export declare const generateStudentToken: (studentId: string, sessionToken: string) => string;
/** Admin/tutor session token. Staff sessions are not single-device. */
export declare const generateAdminToken: (userId: string, type?: "admin" | "student") => string;
export interface StudentTokenPayload {
    id: string;
    type: string;
    sessionToken?: string;
}
/** Verify a student session JWT. Returns null instead of throwing. */
export declare const verifyStudentToken: (token: string) => StudentTokenPayload | null;
/** Cookie options for the session cookie, matching existing behaviour. */
export declare const sessionCookieOptions: () => {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "none" | "lax";
    maxAge: number;
};
