/**
 * SABYR In-Memory Rate Limiter
 *
 * Simple sliding-window rate limiter that works without external dependencies.
 * For production, replace with Upstash Rate Limit:
 *   npm install @upstash/ratelimit @upstash/redis
 *   TODO: Migrate to Upstash when UPSTASH_REDIS_REST_URL is set
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// Separate stores per limit rule
const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name)!;
}

/**
 * Check rate limit for a given identifier (IP address).
 * @param name     - Name of the rule (e.g. "ai-stylist")
 * @param id       - Client identifier (e.g. IP address)
 * @param limit    - Max requests allowed in window
 * @param windowMs - Window size in milliseconds
 * @returns { allowed: boolean; remaining: number; resetMs: number }
 */
export function checkRateLimit(
  name: string,
  id: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetMs: number } {
  const store = getStore(name);
  const now = Date.now();
  const existing = store.get(id);

  if (!existing || now - existing.windowStart > windowMs) {
    // New window
    store.set(id, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetMs: now + windowMs };
  }

  if (existing.count >= limit) {
    const resetMs = existing.windowStart + windowMs;
    return { allowed: false, remaining: 0, resetMs };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetMs: existing.windowStart + windowMs,
  };
}

/**
 * Get client IP from Next.js request.
 * Checks x-forwarded-for (reverse proxy) then x-real-ip, falls back to "unknown".
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
