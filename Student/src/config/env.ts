// Environment configuration with validation
interface EnvConfig {
  API_BASE_URL: string;
  STUDENT_API_URL: string;
  BACKEND_URL: string;
  CDN_HOST: string;
}

function validateEnv(): EnvConfig {
  const requiredVars = {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    CDN_HOST: process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_HOST,
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

  return {
    API_BASE_URL: requiredVars.API_BASE_URL!,
    STUDENT_API_URL: `${requiredVars.API_BASE_URL!}/student`,
    BACKEND_URL: requiredVars.BACKEND_URL!,
    CDN_HOST: requiredVars.CDN_HOST!,
  };
}

export const env = validateEnv();