import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

type RateLimitOptions = {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max unique tokens to track
}

// In-memory rate limiting using LRU cache
// For production, consider Redis for multi-instance deployments
const rateLimitCache = new LRUCache<string, number[]>({
  max: 500, // Maximum number of unique IPs to track
  ttl: 60000, // 1 minute TTL
})

export async function rateLimit(
  request: NextRequest,
  limit: number,
  options: RateLimitOptions = { interval: 60000, uniqueTokenPerInterval: 500 }
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // Use IP address as identifier (in production, consider user ID for authenticated requests)
  const token = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous'

  const now = Date.now()
  const windowStart = now - options.interval

  // Get existing requests for this token
  const tokenRequests = rateLimitCache.get(token) || []

  // Filter out requests outside the current window
  const requestsInWindow = tokenRequests.filter(timestamp => timestamp > windowStart)

  // Check if limit exceeded
  if (requestsInWindow.length >= limit) {
    const oldestRequest = Math.min(...requestsInWindow)
    const reset = oldestRequest + options.interval

    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    }
  }

  // Add current request
  requestsInWindow.push(now)
  rateLimitCache.set(token, requestsInWindow)

  return {
    success: true,
    limit,
    remaining: limit - requestsInWindow.length,
    reset: now + options.interval,
  }
}

// Helper to add rate limit headers to response
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitResult: { limit: number; remaining: number; reset: number }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString())

  return response
}

// Preset configurations for different endpoint types
export const RateLimits = {
  // Read operations (GET requests)
  READ: { limit: 60, interval: 60000 }, // 60 requests per minute

  // Write operations (POST/PUT/PATCH/DELETE)
  WRITE: { limit: 30, interval: 60000 }, // 30 requests per minute

  // Search operations (potentially expensive)
  SEARCH: { limit: 30, interval: 60000 }, // 30 requests per minute

  // Import operations (very expensive)
  IMPORT: { limit: 5, interval: 3600000 }, // 5 requests per hour

  // Auth operations (prevent brute force)
  AUTH: { limit: 10, interval: 60000 }, // 10 requests per minute
}
