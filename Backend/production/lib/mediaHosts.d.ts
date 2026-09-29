/**
 * Allowlist for server-side media fetches (the PDF proxy).
 *
 * Without this the proxy is an SSRF primitive: it would fetch any URL a caller
 * supplies, including cloud metadata endpoints and private addresses. A
 * substring host check is not enough either — `https://evil.com/?x=.b-cdn.net`
 * contains the CDN suffix, which previously caused the Bunny access key to be
 * forwarded to an attacker-controlled host.
 *
 * Hostnames are compared exactly, after parsing.
 */
export declare const BUNNY_STORAGE_HOST = "storage.bunnycdn.com";
/**
 * Parse `raw` and return it only if it points at media we are willing to fetch.
 * Returns null for anything else.
 */
export declare const parseAllowedMediaUrl: (raw: string) => URL | null;
