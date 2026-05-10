import { NextRequest } from "next/server"

import { jsonResponse, optionsResponse } from "@/lib/server/http"
import { rateLimitRequest } from "@/lib/server/rate-limit"
import {
  handleApiError,
  parseJsonBody,
  requireApiAuth,
  validateRecommendationPayload,
} from "@/lib/server/security"
import { generateRecipeRecommendations } from "@/services/ai.service"

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request)
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireApiAuth(request)
    if (authError) {
      return authError
    }

    const ingredients = validateRecommendationPayload(await parseJsonBody(request, "recommend"))
    const rateLimitError = rateLimitRequest(request, "recommend")
    if (rateLimitError) {
      return rateLimitError
    }

    const data = await generateRecipeRecommendations(ingredients)

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
    mode: hasKey ? "ai-json" : "no-api-key",
    description: hasKey ? "AI 生成多样化菜谱推荐（JSON 格式）" : "需要配置 AI_API_KEY",
  })
}
