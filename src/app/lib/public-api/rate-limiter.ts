/**
 * In-memory rate limiter for Public API
 * Uses a sliding window approach with per-minute limits
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// In-memory store for rate limits
// Key: tokenId, Value: { count, resetAt }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of rateLimitStore.entries()) {
            if (value.resetAt < now) {
                rateLimitStore.delete(key);
            }
        }
    }, CLEANUP_INTERVAL);
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    limit: number;
}

/**
 * Check if a request is within rate limits
 *
 * @param tokenId - The token ID to track
 * @param limit - Maximum requests per minute (default: 60)
 * @returns Object with allowed status, remaining requests, and reset time
 */
export function checkRateLimit(tokenId: string, limit: number = 60): RateLimitResult {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    const key = `rate:${tokenId}`;
    const current = rateLimitStore.get(key);

    // If no existing entry or window expired, start fresh
    if (!current || current.resetAt < now) {
        const resetAt = now + windowMs;
        rateLimitStore.set(key, { count: 1, resetAt });
        return {
            allowed: true,
            remaining: limit - 1,
            resetAt,
            limit,
        };
    }

    // Check if over limit
    if (current.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: current.resetAt,
            limit,
        };
    }

    // Increment counter
    current.count++;
    return {
        allowed: true,
        remaining: limit - current.count,
        resetAt: current.resetAt,
        limit,
    };
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(tokenId: string, limit: number = 60): RateLimitResult {
    const now = Date.now();
    const windowMs = 60 * 1000;

    const key = `rate:${tokenId}`;
    const current = rateLimitStore.get(key);

    if (!current || current.resetAt < now) {
        return {
            allowed: true,
            remaining: limit,
            resetAt: now + windowMs,
            limit,
        };
    }

    return {
        allowed: current.count < limit,
        remaining: Math.max(0, limit - current.count),
        resetAt: current.resetAt,
        limit,
    };
}

/**
 * Reset rate limit for a token (useful for testing)
 */
export function resetRateLimit(tokenId: string): void {
    rateLimitStore.delete(`rate:${tokenId}`);
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    };
}
