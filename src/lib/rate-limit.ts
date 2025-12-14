/**
 * H004: Rate Limiting Library
 * Prevents DoS attacks and resource exhaustion
 */

// In-memory rate limiter (for serverless, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Default configurations for different endpoints
export const RATE_LIMITS = {
  // Auth endpoints - strict limits
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },      // 5 per 15 min
  
  // API endpoints - moderate limits
  api: { windowMs: 60 * 1000, maxRequests: 60 },           // 60 per minute
  
  // Payment endpoints - very strict
  payment: { windowMs: 60 * 1000, maxRequests: 10 },       // 10 per minute
  
  // Admin endpoints - moderate
  admin: { windowMs: 60 * 1000, maxRequests: 30 },         // 30 per minute
  
  // Habit operations - generous
  habits: { windowMs: 60 * 1000, maxRequests: 100 },       // 100 per minute
  
  // Search/analytics - moderate
  analytics: { windowMs: 60 * 1000, maxRequests: 20 },     // 20 per minute
} as const;

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }
  
  if (existing.count >= config.maxRequests) {
    // Rate limited
    return {
      success: false,
      remaining: 0,
      resetTime: existing.resetTime,
      retryAfter: Math.ceil((existing.resetTime - now) / 1000),
    };
  }
  
  // Increment counter
  existing.count++;
  rateLimitStore.set(key, existing);
  
  return {
    success: true,
    remaining: config.maxRequests - existing.count,
    resetTime: existing.resetTime,
  };
}

/**
 * Create rate limit key from request
 */
export function getRateLimitKey(
  userId: string | null,
  ip: string | null,
  endpoint: string
): string {
  const identifier = userId || ip || 'anonymous';
  return `${endpoint}:${identifier}`;
}

/**
 * Clean up expired entries to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit middleware helper for API routes
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter: result.retryAfter,
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': (result.retryAfter || 60).toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
  config: RateLimitConfig
): void {
  headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetTime.toString());
}

/**
 * Sliding window rate limiter (more accurate but more memory)
 */
const slidingWindowStore = new Map<string, number[]>();

export function checkSlidingWindowRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const windowStart = now - config.windowMs;
  
  let timestamps = slidingWindowStore.get(key) || [];
  
  // Remove timestamps outside the window
  timestamps = timestamps.filter(ts => ts > windowStart);
  
  if (timestamps.length >= config.maxRequests) {
    const oldestInWindow = timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + config.windowMs - now) / 1000);
    
    return {
      success: false,
      remaining: 0,
      resetTime: oldestInWindow + config.windowMs,
      retryAfter,
    };
  }
  
  // Add current timestamp
  timestamps.push(now);
  slidingWindowStore.set(key, timestamps);
  
  return {
    success: true,
    remaining: config.maxRequests - timestamps.length,
    resetTime: now + config.windowMs,
  };
}
