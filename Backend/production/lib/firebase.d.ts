/**
 * Registration routes store emails through express-validator's
 * `normalizeEmail()`, so `John.Doe+x@gmail.com` is persisted as
 * `johndoe@gmail.com`. Any lookup by a verified token email has to apply the
 * same canonicalisation or existing Gmail accounts will not be found.
 */
export declare const canonicalizeEmail: (email: string) => string;
export interface VerifiedIdentity {
    uid: string;
    email: string;
    emailVerified: boolean;
    name?: string;
    picture?: string;
    provider?: string;
}
/**
 * Verify a Firebase ID token and return the identity it actually proves.
 * Throws UnauthorizedError on any failure.
 */
export declare const verifyFirebaseIdToken: (idToken: string) => Promise<VerifiedIdentity>;
