import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (in production, use Redis)
const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export function createRateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> => {
    const key = config.keyGenerator ? config.keyGenerator(req) : getDefaultKey(req);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create entry for this key
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }

    // Increment count
    store[key].count++;

    const remaining = Math.max(0, config.maxRequests - store[key].count);
    const success = store[key].count <= config.maxRequests;

    return {
      success,
      limit: config.maxRequests,
      remaining,
      resetTime: store[key].resetTime
    };
  };
}

function getDefaultKey(req: NextRequest): string {
  // Use IP address as default key
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
  return `rate_limit:${ip}`;
}

// Predefined rate limiters
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return `auth:${ip}`;
  }
});

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
});

export const openaiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyGenerator: (req) => {
    // Extract user ID from auth if available
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      return `openai:${authHeader}`;
    }
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return `openai:${ip}`;
  }
});

export const adminRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return `admin:${ip}`;
  }
});

// Helper function to add rate limit headers to response
export function addRateLimitHeaders(
  response: Response,
  rateLimitResult: { limit: number; remaining: number; resetTime: number }
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
