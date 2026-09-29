"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseIdToken = exports.canonicalizeEmail = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const validator_1 = __importDefault(require("validator"));
const Errors_1 = require("../errors/Errors");
/**
 * Server-side verification of Firebase ID tokens, via the official Admin SDK.
 *
 * Both Google and GitHub sign-in go through Firebase on the client, so every
 * OAuth flow produces a Firebase ID token. The SDK checks signature, issuer,
 * audience and expiry against Google's published certificates.
 *
 * The identity used to establish a session comes from the *verified* payload
 * only — never from a field the client supplied alongside the token.
 */
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "eduauthentication-88b27";
/**
 * A service account is optional: `verifyIdToken` only needs the project id,
 * since it validates against Google's public certs. Supplying credentials
 * additionally enables revocation checks.
 *
 * Accepts the whole service-account JSON in FIREBASE_SERVICE_ACCOUNT.
 */
const buildCredential = () => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw)
        return undefined;
    try {
        const parsed = JSON.parse(raw);
        // Railway/Vercel env vars keep "\n" escaped; restore real newlines.
        if (typeof parsed.private_key === "string") {
            parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
        }
        return firebase_admin_1.default.credential.cert(parsed);
    }
    catch (error) {
        console.error("FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON; " +
            "falling back to project-id-only verification.", error);
        return undefined;
    }
};
/** Initialised once, lazily, so importing this module has no side effects. */
let cachedApp = null;
const getApp = () => {
    if (cachedApp)
        return cachedApp;
    const credential = buildCredential();
    cachedApp = firebase_admin_1.default.apps.length
        ? firebase_admin_1.default.app()
        : firebase_admin_1.default.initializeApp({
            projectId: FIREBASE_PROJECT_ID,
            ...(credential ? { credential } : {}),
        });
    return cachedApp;
};
/**
 * Registration routes store emails through express-validator's
 * `normalizeEmail()`, so `John.Doe+x@gmail.com` is persisted as
 * `johndoe@gmail.com`. Any lookup by a verified token email has to apply the
 * same canonicalisation or existing Gmail accounts will not be found.
 */
const canonicalizeEmail = (email) => validator_1.default.normalizeEmail(email) || email.trim().toLowerCase();
exports.canonicalizeEmail = canonicalizeEmail;
/**
 * Verify a Firebase ID token and return the identity it actually proves.
 * Throws UnauthorizedError on any failure.
 */
const verifyFirebaseIdToken = async (idToken) => {
    if (!idToken || typeof idToken !== "string") {
        throw new Errors_1.UnauthorizedError("Sign-in token is missing.");
    }
    let decoded;
    try {
        decoded = await firebase_admin_1.default.auth(getApp()).verifyIdToken(idToken);
    }
    catch (error) {
        console.error("Firebase ID token verification failed:", error?.code || error?.message);
        throw new Errors_1.UnauthorizedError("Sign-in could not be verified. Please try again.");
    }
    if (!decoded.email) {
        throw new Errors_1.UnauthorizedError("Sign-in did not provide an email address.");
    }
    return {
        uid: decoded.uid,
        email: (0, exports.canonicalizeEmail)(decoded.email),
        emailVerified: Boolean(decoded.email_verified),
        name: typeof decoded.name === "string" ? decoded.name : undefined,
        picture: typeof decoded.picture === "string" ? decoded.picture : undefined,
        provider: decoded.firebase?.sign_in_provider,
    };
};
exports.verifyFirebaseIdToken = verifyFirebaseIdToken;
