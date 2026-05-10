import "server-only"

import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { jsonResponse } from "@/lib/server/http"

type ApiRouteName = "vision" | "recommend" | "detail"

interface JwtPayload {
  aud?: string | string[]
  exp?: number
  iss?: string
  nbf?: number
  sub?: string
}

interface DetailPayload {
  recipeName: string
  mainIngredients: string[]
  availableIngredients: string[]
}

const MAX_VISION_JSON_BYTES = 3 * 1024 * 1024
const MAX_VISION_IMAGE_BYTES = 2 * 1024 * 1024
const MAX_STANDARD_JSON_BYTES = 32 * 1024
const MAX_INGREDIENTS = 30
const MAX_INGREDIENT_LENGTH = 30
const MAX_RECIPE_NAME_LENGTH = 60
const AUTH_DISABLED_VALUES = new Set(["0", "false", "off", "disabled"])

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message)
    this.name = "ApiRequestError"
  }
}

function getMaxJsonBytes(route: ApiRouteName): number {
  return route === "vision" ? MAX_VISION_JSON_BYTES : MAX_STANDARD_JSON_BYTES
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

function isAuthRequired(): boolean {
  const configured = process.env.API_AUTH_REQUIRED?.trim().toLowerCase()

  if (configured) {
    return !AUTH_DISABLED_VALUES.has(configured)
  }

  return Boolean(process.env.API_CLIENT_TOKEN || process.env.SUPABASE_JWT_SECRET || isProduction())
}

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization")
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

function safeTokenEquals(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  return Buffer.from(padded, "base64")
}

function hasExpectedAudience(payload: JwtPayload): boolean {
  const expectedAudience = process.env.SUPABASE_JWT_AUDIENCE?.trim()

  if (!expectedAudience) {
    return true
  }

  return Array.isArray(payload.aud)
    ? payload.aud.includes(expectedAudience)
    : payload.aud === expectedAudience
}

function hasExpectedIssuer(payload: JwtPayload): boolean {
  const expectedIssuer = process.env.SUPABASE_JWT_ISSUER?.trim()
  return !expectedIssuer || payload.iss === expectedIssuer
}

function verifyHs256Jwt(token: string, secret: string): boolean {
  const parts = token.split(".")

  if (parts.length !== 3) {
    return false
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8")) as {
    alg?: string
    typ?: string
  }

  if (header.alg !== "HS256") {
    return false
  }

  const signedContent = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedContent)
    .digest("base64url")

  if (!safeTokenEquals(encodedSignature, expectedSignature)) {
    return false
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as JwtPayload
  const now = Math.floor(Date.now() / 1000)

  if (!payload.sub || (payload.exp && payload.exp <= now) || (payload.nbf && payload.nbf > now)) {
    return false
  }

  return hasExpectedAudience(payload) && hasExpectedIssuer(payload)
}

export async function requireApiAuth(request: NextRequest): Promise<NextResponse | null> {
  if (!isAuthRequired()) {
    return null
  }

  const token = getBearerToken(request)

  if (!token) {
    return jsonResponse(request, { success: false, error: "Unauthorized" }, { status: 401 })
  }

  const staticToken = process.env.API_CLIENT_TOKEN?.trim()
  if (staticToken && safeTokenEquals(token, staticToken)) {
    return null
  }

  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET?.trim()
  if (supabaseJwtSecret) {
    try {
      if (verifyHs256Jwt(token, supabaseJwtSecret)) {
        return null
      }
    } catch {}
  }

  if (!staticToken && !supabaseJwtSecret) {
    return jsonResponse(
      request,
      { success: false, error: "API authentication is not configured" },
      { status: 500 }
    )
  }

  return jsonResponse(request, { success: false, error: "Unauthorized" }, { status: 401 })
}

export async function parseJsonBody(request: NextRequest, route: ApiRouteName): Promise<unknown> {
  const maxBytes = getMaxJsonBytes(route)
  const contentLength = Number(request.headers.get("content-length") || 0)

  if (contentLength > maxBytes) {
    throw new ApiRequestError("Request body is too large", 413)
  }

  const rawBody = await request.text()

  if (Buffer.byteLength(rawBody, "utf8") > maxBytes) {
    throw new ApiRequestError("Request body is too large", 413)
  }

  try {
    return JSON.parse(rawBody)
  } catch {
    throw new ApiRequestError("Invalid JSON body", 400)
  }
}

function assertObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiRequestError("Request body must be an object", 400)
  }

  return value as Record<string, unknown>
}

function normalizeStringList(
  value: unknown,
  fieldName: string,
  options: { minItems?: number; maxItems?: number } = {}
): string[] {
  if (!Array.isArray(value)) {
    throw new ApiRequestError(`${fieldName} must be an array`, 400)
  }

  const maxItems = options.maxItems ?? MAX_INGREDIENTS
  const seen = new Set<string>()
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= MAX_INGREDIENT_LENGTH)
    .filter((item) => {
      const normalized = item.toLowerCase()
      if (seen.has(normalized)) {
        return false
      }
      seen.add(normalized)
      return true
    })

  if (items.length < (options.minItems ?? 0)) {
    throw new ApiRequestError(`${fieldName} is required`, 400)
  }

  if (items.length > maxItems) {
    throw new ApiRequestError(`${fieldName} has too many items`, 400)
  }

  return items
}

function estimateBase64Bytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

export function validateVisionPayload(body: unknown): string {
  const data = assertObject(body)
  const image = typeof data.image === "string" ? data.image.trim() : ""
  const match = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/)

  if (!match) {
    throw new ApiRequestError("Invalid image format", 400)
  }

  if (estimateBase64Bytes(match[2]) > MAX_VISION_IMAGE_BYTES) {
    throw new ApiRequestError("Image is too large", 413)
  }

  return image
}

export function validateRecommendationPayload(body: unknown): string[] {
  const data = assertObject(body)
  return normalizeStringList(data.ingredients, "ingredients", { minItems: 1 })
}

export function validateDetailPayload(body: unknown): DetailPayload {
  const data = assertObject(body)
  const recipeName = typeof data.recipeName === "string" ? data.recipeName.trim() : ""

  if (!recipeName || recipeName.length > MAX_RECIPE_NAME_LENGTH) {
    throw new ApiRequestError("Invalid recipeName", 400)
  }

  return {
    recipeName,
    mainIngredients: normalizeStringList(data.mainIngredients, "mainIngredients", {
      minItems: 1,
    }),
    availableIngredients: normalizeStringList(data.availableIngredients, "availableIngredients"),
  }
}

export function handleApiError(request: NextRequest, error: unknown): NextResponse {
  if (error instanceof ApiRequestError) {
    return jsonResponse(
      request,
      { success: false, error: error.message },
      { status: error.status }
    )
  }

  console.error("[api] unhandled server error", error)

  return jsonResponse(
    request,
    { success: false, error: "服务器开小差了，请稍后再试" },
    { status: 500 }
  )
}
