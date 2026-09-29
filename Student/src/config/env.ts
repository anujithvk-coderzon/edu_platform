// Environment configuration with validation
interface EnvConfig {
  API_BASE_URL: string;
  STUDENT_API_URL: string;
  BACKEND_URL: string;
}

// NEXT_PUBLIC_* values are inlined into the client bundle at build time, so a
// "localhost" configured here means "whatever device is running the browser"
// once the page is opened from another machine -- a phone on the same Wi-Fi
// gets its own localhost and every API call fails.
//
// When the page was served from some other host, point loopback URLs at that
// host instead and keep the port. On the laptop this is a no-op, and it is
// skipped entirely on the server, where localhost is genuinely correct.
function forCurrentHost(url: string): string {
  if (typeof window === 'undefined') return url;

  try {
    const parsed = new URL(url);
    const isLoopback =
      parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (!isLoopback || window.location.hostname === parsed.hostname) return url;

    parsed.hostname = window.location.hostname;
    // URL.toString() appends a trailing slash to an empty path, which would
    // produce a double slash when callers concatenate their endpoint.
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

function validateEnv(): EnvConfig {
  const requiredVars = {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  };

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => `NEXT_PUBLIC_${key.replace('_URL', '_BASE_URL')}`);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  const apiBaseUrl = forCurrentHost(requiredVars.API_BASE_URL!);

  return {
    API_BASE_URL: apiBaseUrl,
    STUDENT_API_URL: `${apiBaseUrl}/student`,
    BACKEND_URL: forCurrentHost(requiredVars.BACKEND_URL!),
  };
}

export const env = validateEnv();