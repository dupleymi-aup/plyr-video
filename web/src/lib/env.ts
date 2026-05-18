/**
 * Validate required environment variables at startup.
 * Run this at the top of the server entry point to fail fast
 * if critical configuration is missing.
 */

const requiredServerVars = [
  "DATABASE_URL",
  "AUTH_SECRET",
];

const requiredPublicVars = [
  "NEXT_PUBLIC_APP_URL",
];

export function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredServerVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Only check public vars on the client side
  if (typeof window !== "undefined") {
    for (const key of requiredPublicVars) {
      if (!process.env[key as keyof NodeJS.ProcessEnv]) {
        missing.push(key);
      }
    }
  }

  // Warn about empty S3 config (non-fatal since it's optional)
  if (!process.env.S3_ENDPOINT && !process.env.S3_PUBLIC_URL) {
    console.warn(
      "[env] S3_ENDPOINT and S3_PUBLIC_URL are not set. Video uploads will not work."
    );
  }

  // Warn about empty AUTH_SECRET
  if (!process.env.AUTH_SECRET) {
    console.error(
      "[env] AUTH_SECRET is not set. Authentication will not work. " +
        'Run `openssl rand -base64 32` to generate a secure secret.'
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Please check your .env file."
    );
  }
}
