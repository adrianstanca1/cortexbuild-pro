/**
 * Rate Limiting Implementation
 *
 * Implements token bucket algorithm for API rate limiting
 * Stores rate limit state in memory (can be upgraded to Redis for distributed systems)
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (upgrade to Redis for production clusters)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * Create a rate limiter with configurable options
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = "Too many requests, please try again later.",
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async (
    identifier: string,
    options?: { isSuccess?: boolean },
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    message: string;
  }> => {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitStore.get(key);

    // Create or reset entry if window expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        message,
      };
    }

    // Determine if we should count this request
    const shouldCount =
      (options?.isSuccess === true && !skipSuccessfulRequests) ||
      (options?.isSuccess === false && !skipFailedRequests) ||
      options?.isSuccess === undefined;

    if (shouldCount) {
      entry.count++;
    }

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
      message: "",
    };
  };
}

/**
 * Predefined rate limiters for different use cases
 */
export const rateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts
    message: "Too many authentication attempts, please try again later.",
  }),

  // Standard rate limit for API endpoints
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests
    message: "Too many requests, please slow down.",
  }),

  // Lenient rate limit for file uploads
  upload: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads
    message: "Too many file uploads, please try again later.",
  }),

  // Strict rate limit for webhooks
  webhook: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 webhooks
    message: "Too many webhook requests, please slow down.",
  }),

  // Very strict for password reset
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts
    message: "Too many password reset attempts, please try again later.",
  }),
};

/**
 * Get rate limit identifier from request
 * Uses IP address or user ID for authenticated requests
 */
/**
 * Get rate limit statistics for monitoring
 */
export function getRateLimitStats(): {
  totalEntries: number;
  activeLimits: number;
} {
  const now = Date.now();
  let activeLimits = 0;
  for (const entry of rateLimitStore.values()) {
    if (entry.resetTime > now) {
      activeLimits++;
    }
  }
  return {
    totalEntries: rateLimitStore.size,
    activeLimits,
  };
}

export function getRateLimitIdentifier(req: Request, userId?: string): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : req.headers.get("x-real-ip") || "unknown";

  return `ip:${ip}`;
}

/**
 * Helper to check rate limit and return error response if exceeded
 * @param limiter - The rate limiter function to use
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @param options - Optional parameters for conditional counting
 */
export async function checkRateLimit(
  limiter: ReturnType<typeof createRateLimiter>,
  identifier: string,
  config: RateLimitConfig,
  options?: { isSuccess?: boolean },
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const result = await limiter(identifier, options);

  if (!result.allowed) {
    const resetDate = new Date(result.resetTime);
    const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
    const response = new Response(
      JSON.stringify({
        error: "Too many requests",
        message:
          result.message ||
          config.message ||
          "Rate limit exceeded. Please try again later.",
        retryAfter: retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfterSeconds.toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetDate.toISOString(),
        },
      },
    );

    return { ok: false, response };
  }
  return { ok: true };
}
