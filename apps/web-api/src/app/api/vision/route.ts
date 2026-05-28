import { NextRequest } from "next/server"

import { jsonResponse, optionsResponse } from "@/lib/server/http"
import { rateLimitRequest } from "@/lib/server/rate-limit"
import {
  handleApiError,
  parseJsonBody,
  requireApiAuth,
  validateVisionPayload,
} from "@/lib/server/security"
import { DEFAULT_VISION_MODEL, recognizeIngredientsFromImage } from "@/services/ai.service"

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request)
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireApiAuth(request)
    if (authError) {
      return authError
    }

    const image = validateVisionPayload(await parseJsonBody(request, "vision"))
    const rateLimitError = rateLimitRequest(request, "vision")
    if (rateLimitError) {
      return rateLimitError
    }

    const data = await recognizeIngredientsFromImage(image)

    return jsonResponse(request, {
      success: true,
      data,
    })
  } catch (error) {
    return handleApiError(request, error)
  }
}

export async function GET(request: NextRequest) {
  const hasKey = Boolean(process.env.AI_API_KEY)

  return jsonResponse(request, {
    status: "ok",
    provider: "xiaomi-mimo",
    model: process.env.VISION_MODEL_NAME || DEFAULT_VISION_MODEL,
    configured: hasKey,
    mode: hasKey ? "real" : "not_configured",
  })
}
