import "server-only"

import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { jsonResponse } from "@/lib/server/http"

const DEFAULT_LIMIT = 10
const DEFAULT_WINDOW_MS = 60 * 1000
const MAX_BUCKET_AGE_MS = 5 * DEFAULT_WINDOW_MS
const ROUTE_LIMITS: Record<string, { limit: number; windowMs?: number }> = {
  vision: { limit: 30 },
  detail: { limit: 20 },
  recommend: { limit: 12 },
}

interface RateLimitBucket {
  count: number
  windowStart: number
}

interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
}

const buckets = new Map<string, RateLimitBucket>()

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex").slice(0, 32)
}

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization")
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()
  const cfIp = request.headers.get("cf-connecting-ip")?.trim()
  const ip = forwardedFor || realIp || cfIp

  if (ip) {
    return `ip:${ip}`
  }

  const token = getBearerToken(request)
  if (token) {
    return `token:${hashToken(token)}`
  }

  return "anonymous"
}

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > MAX_BUCKET_AGE_MS) {
      buckets.delete(key)
    }
  }
}

function checkRateLimit(
  request: NextRequest,
  scope: string,
  options: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const limit = options.limit ?? DEFAULT_LIMIT
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
  const now = Date.now()
  const key = `${scope}:${getClientIdentifier(request)}`

  pruneExpiredBuckets(now)

  const current = buckets.get(key)
  const bucket =
    current && now - current.windowStart < windowMs
      ? current
      : {
          count: 0,
          windowStart: now,
        }

  bucket.count += 1
  buckets.set(key, bucket)

  const resetAt = bucket.windowStart + windowMs
  const remaining = Math.max(limit - bucket.count, 0)

  return {
    allowed: bucket.count <= limit,
    limit,
    remaining,
    resetAt,
  }
}

export function rateLimitRequest(request: NextRequest, scope: string): NextResponse | null {
  const result = checkRateLimit(request, scope, ROUTE_LIMITS[scope])

  if (result.allowed) {
    return null
  }

  const retryAfterSeconds = Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1)

  return jsonResponse(
    request,
    { success: false, error: "请求太频繁，请稍后再试" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  )
}
