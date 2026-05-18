/**
 * In-memory rate limiter using a sliding window counter.
 *
 * Each key (e.g. IP address or user ID) tracks timestamps of recent requests.
 * Old entries outside the window are pruned on each check.
 *
 * For production with multiple instances, replace this with Redis-backed limiting.
 */

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Prune old timestamps outside the window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const remaining = Math.max(0, limit - entry.timestamps.length);
  const resetAt =
    entry.timestamps.length > 0
      ? entry.timestamps[0] + windowMs
      : now + windowMs;

  if (entry.timestamps.length >= limit) {
    return { ok: false, limit, remaining: 0, resetAt };
  }

  // Record this request
  entry.timestamps.push(now);
  return { ok: true, limit, remaining: remaining - 1, resetAt };
}

/**
 * Clean up expired entries periodically to prevent memory leaks.
 * Call this from a cron or setInterval in a long-running process.
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.timestamps.length === 0 || now - entry.timestamps[entry.timestamps.length - 1] > 3600000) {
      store.delete(key);
    }
  }
}

// Cleanup every hour
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 3600000);
}

/**
 * Helper to extract client IP from Next.js request headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
