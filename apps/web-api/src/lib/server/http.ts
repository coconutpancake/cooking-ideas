import "server-only"

import { NextRequest, NextResponse } from "next/server"

const DEFAULT_ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(?::\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(?::\d+)?$/i,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?$/i,
  /^https?:\/\/172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(?::\d+)?$/i,
  /^https:\/\/.*\.expo\.app$/i,
  /^https:\/\/.*\.exp\.direct$/i,
]

function escapeRegex(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function patternToRegex(pattern: string): RegExp {
  const normalized = pattern.trim()
  const regexSource = `^${escapeRegex(normalized).replace(/\\\*/g, ".*")}$`
  return new RegExp(regexSource, "i")
}

function getConfiguredOriginPatterns(): RegExp[] {
  const configured = process.env.CORS_ALLOWED_ORIGINS

  if (!configured) {
    return DEFAULT_ALLOWED_ORIGIN_PATTERNS
  }

  return configured
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(patternToRegex)
}

function resolveAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin")

  if (!origin) {
    return "*"
  }

  const matched = getConfiguredOriginPatterns().some((pattern) => pattern.test(origin))
  return matched ? origin : "null"
}

function buildCorsHeaders(request: NextRequest): HeadersInit {
  const allowedOrigin = resolveAllowedOrigin(request)
  const requestedHeaders = request.headers.get("access-control-request-headers")

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": requestedHeaders || "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin, Access-Control-Request-Headers",
  }
}

export function jsonResponse(
  request: NextRequest,
  body: unknown,
  init?: ResponseInit
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...buildCorsHeaders(request),
      ...(init?.headers || {}),
    },
  })
}

export function optionsResponse(request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request),
  })
}
