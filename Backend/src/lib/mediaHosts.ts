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
export const BUNNY_STORAGE_HOST = "storage.bunnycdn.com";

const pullZoneHost = (): string | null => {
  const raw = process.env.BUNNY_PULL_ZONE_HOST;
  if (!raw) return null;
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();
};

/**
 * Parse `raw` and return it only if it points at media we are willing to fetch.
 * Returns null for anything else.
 */
export const parseAllowedMediaUrl = (raw: string): URL | null => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;

  const allowed = new Set<string>([BUNNY_STORAGE_HOST]);
  const pull = pullZoneHost();
  if (pull) allowed.add(pull);

  return allowed.has(url.hostname.toLowerCase()) ? url : null;
};
