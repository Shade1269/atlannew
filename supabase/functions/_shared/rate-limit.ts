/**
 * Rate Limiting Utility - حماية من الاستخدام المفرط
 *
 * Uses in-memory storage for simplicity.
 * For production at scale, consider using Redis or Supabase table.
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom key generator (default: IP address) */
  keyGenerator?: (request: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on function cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Default configurations for common use cases
 */
export const RATE_LIMIT_PRESETS = {
  /** Standard API: 100 requests per minute */
  standard: { maxRequests: 100, windowMs: 60 * 1000 },
  /** Strict for auth: 5 requests per minute */
  auth: { maxRequests: 5, windowMs: 60 * 1000 },
  /** OTP: 3 requests per minute */
  otp: { maxRequests: 3, windowMs: 60 * 1000 },
  /** Payment: 10 requests per minute */
  payment: { maxRequests: 10, windowMs: 60 * 1000 },
  /** Search: 30 requests per minute */
  search: { maxRequests: 30, windowMs: 60 * 1000 },
} as const;

/**
 * Get client identifier from request
 */
function getClientKey(request: Request): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");

  // Use the first available IP
  const ip = forwarded?.split(",")[0]?.trim() || realIp || cfIp || "unknown";

  // Include user agent for additional uniqueness
  const userAgent = request.headers.get("user-agent") || "";
  const userAgentHash = userAgent.slice(0, 20);

  return `${ip}:${userAgentHash}`;
}

/**
 * Clean up expired entries (called periodically)
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if request is rate limited
 *
 * @returns null if allowed, or Response if rate limited
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMIT_PRESETS.standard
): Response | null {
  const { maxRequests, windowMs, keyGenerator } = config;

  // Generate key for this client
  const key = keyGenerator ? keyGenerator(request) : getClientKey(request);
  const now = Date.now();

  // Clean up expired entries occasionally (1% chance)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  // Get or create entry
  let entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetTime) {
    // New window
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    return null; // Allowed
  }

  // Increment count
  entry.count++;

  if (entry.count > maxRequests) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    return new Response(
      JSON.stringify({
        error: "rate_limit_exceeded",
        message: "عدد الطلبات تجاوز الحد المسموح. حاول مرة أخرى لاحقاً.",
        message_en: "Too many requests. Please try again later.",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(entry.resetTime),
        },
      }
    );
  }

  return null; // Allowed
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  request: Request,
  config: RateLimitConfig = RATE_LIMIT_PRESETS.standard
): Response {
  const key = config.keyGenerator
    ? config.keyGenerator(request)
    : getClientKey(request);
  const entry = rateLimitStore.get(key);

  if (!entry) return response;

  const headers = new Headers(response.headers);
  headers.set("X-RateLimit-Limit", String(config.maxRequests));
  headers.set(
    "X-RateLimit-Remaining",
    String(Math.max(0, config.maxRequests - entry.count))
  );
  headers.set("X-RateLimit-Reset", String(entry.resetTime));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Middleware-style rate limiter
 *
 * @example
 * ```ts
 * import { withRateLimit, RATE_LIMIT_PRESETS } from '../_shared/rate-limit.ts';
 *
 * Deno.serve(async (req) => {
 *   const rateLimitResponse = withRateLimit(req, RATE_LIMIT_PRESETS.auth);
 *   if (rateLimitResponse) return rateLimitResponse;
 *
 *   // Continue with normal processing
 *   return new Response('OK');
 * });
 * ```
 */
export function withRateLimit(
  request: Request,
  config?: RateLimitConfig
): Response | null {
  return checkRateLimit(request, config);
}
