import type { Request } from "express";

/**
 * Resolve the caller's session token.
 *
 * iOS Safari blocks third-party cookies, so requests from iPhone carry the
 * token in the Authorization header and no cookie at all. Handlers that read
 * `req.cookies.<name>` directly would reject those requests even when
 * authMiddleware has already accepted them.
 *
 * Cookie first, to keep behaviour identical for browsers that send one.
 */
const fromAuthHeader = (req: Request): string | undefined => {
  const header = req.header("Authorization");
  if (!header) return undefined;

  // Require the scheme AND a non-empty credential, so a bare "Bearer" yields
  // nothing rather than the literal word as a token.
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || undefined;
};

export const getStudentToken = (req: Request): string | undefined =>
  req.cookies?.student_token || fromAuthHeader(req);

export const getAdminToken = (req: Request): string | undefined =>
  req.cookies?.admin_token || fromAuthHeader(req);
