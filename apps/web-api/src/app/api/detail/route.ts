import { NextRequest } from "next/server"

import { jsonResponse, optionsResponse } from "@/lib/server/http"
import { createServerOpenAIClient } from "@/lib/server/openai"
import { rateLimitRequest } from "@/lib/server/rate-limit"
import {
  handleApiError,
  parseJsonBody,
  requireApiAuth,
  validateDetailPayload,
} from "@/lib/server/security"
import { DEFAULT_TEXT_MODEL } from "@/services/ai.service"

interface ParsedStep {
  order: number
  description: string
}

interface IngredientAmount {
  name: string
  amount: string
}

interface StructuredRecipeDetail {
  mainIngredients: IngredientAmount[]
  seasonings: IngredientAmount[]
  steps: ParsedStep[]
  tips?: string
}

const DEFAULT_DETAIL_MODEL = DEFAULT_TEXT_MODEL

function formatIngredients(availableIngredients: string[], allIngredients: string[]): string {
  const availableSet = new Set(availableIngredients.map((item) => item.toLowerCase()))

  return allIngredients
    .map((ingredient) =>
      `${ingredient}${availableSet.has(ingredient.toLowerCase()) ? " [已有]" : " [缺少]"}`
    )
    .join("、")
}

function parseSteps(text: string): ParsedStep[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const steps: ParsedStep[] = []

  for (const line of lines) {
    const cleaned = line
      .replace(/^[1-9]\d*[.\u3001)\s-]*/, "")
      .replace(/^step\s*\d+[:.)\s-]*/i, "")
      .trim()

    if (cleaned.length > 5) {
      steps.push({
        order: steps.length + 1,
        description: cleaned,
      })
    }
  }

  if (steps.length === 0 && text.trim()) {
    return [{ order: 1, description: text.trim() }]
  }

  return steps
}

function parseIngredientAmounts(value: unknown): IngredientAmount[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const record = item as Record<string, unknown>
      const name = typeof record.name === "string" ? record.name.trim() : ""
      const amount = typeof record.amount === "string" ? record.amount.trim() : ""

      return name && amount ? { name, amount } : null
    })
    .filter((item): item is IngredientAmount => Boolean(item))
}

function parseStructuredDetail(content: string): StructuredRecipeDetail | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    return null
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    const mainIngredients = parseIngredientAmounts(parsed.mainIngredients)
    const seasonings = parseIngredientAmounts(parsed.seasonings)
    const steps = Array.isArray(parsed.steps)
      ? parsed.steps
          .map((step, index) => {
            if (typeof step === "string") {
              const description = step.trim()
              return description ? { order: index + 1, description } : null
            }

            if (!step || typeof step !== "object") {
              return null
            }

            const record = step as Record<string, unknown>
            const description =
              typeof record.description === "string" ? record.description.trim() : ""
            const order =
              typeof record.order === "number" && Number.isFinite(record.order)
                ? Math.max(1, Math.round(record.order))
                : index + 1

            return description ? { order, description } : null
          })
          .filter((step): step is ParsedStep => Boolean(step))
      : []
    const tips = typeof parsed.tips === "string" ? parsed.tips.trim() : undefined

    if (steps.length === 0) {
      return null
    }

    return {
      mainIngredients,
      seasonings,
      steps,
      tips,
    }
  } catch {
    return null
  }
}

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request)
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireApiAuth(request)
    if (authError) {
      return authError
    }

    const body = validateDetailPayload(await parseJsonBody(request, "detail"))
    const { recipeName, mainIngredients, seasonings, availableIngredients } = body

    if (!recipeName) {
      return jsonResponse(
        request,
        { success: false, error: "缺少菜谱名称" },
        { status: 400 }
      )
    }

    const rateLimitError = rateLimitRequest(request, "detail")
    if (rateLimitError) {
      return rateLimitError
    }

    if (!process.env.AI_API_KEY) {
      return jsonResponse(
        request,
        { success: false, error: "未配置 AI_API_KEY，无法生成菜谱步骤" },
        { status: 503 }
      )
    }

    const client = createServerOpenAIClient()
    const model = process.env.DETAIL_MODEL_NAME || DEFAULT_DETAIL_MODEL
    const fallbackModel = process.env.TEXT_MODEL_NAME || DEFAULT_TEXT_MODEL
    const ingredientList = formatIngredients(availableIngredients, mainIngredients)
    const seasoningText = seasonings.length > 0 ? seasonings.join("、") : "按家常需要补充"

    const prompt =
      "为「" +
      recipeName +
      "」生成两人份用量和家常做法。\n" +
      "主食材：\n" +
      ingredientList +
      "\n" +
      "调料候选：\n" +
      seasoningText +
      "\n" +
      "要求：两人份；用量按菜名判断，主体食材不能偏少，如胡萝卜丝用胡萝卜1-2根、番茄炒蛋用番茄2个鸡蛋2-3个；步骤4-5步，每步45字内，写清火候；只输出JSON。\n" +
      '{"mainIngredients":[{"name":"胡萝卜","amount":"1-2根"}],"seasonings":[{"name":"盐","amount":"半小勺"}],"steps":[{"order":1,"description":"..."}],"tips":"1句小贴士"}'

    const completionConfig = {
      messages: [
        {
          role: "system" as const,
          content: "你是家常菜厨师，只返回可解析JSON。",
        },
        { role: "user" as const, content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: "json_object" as const },
      extra_body: { thinking: { type: "disabled" } },
    }

    let completion
    try {
      completion = await client.chat.completions.create({
        model,
        ...completionConfig,
      })
    } catch (error) {
      if (model === fallbackModel) {
        throw error
      }

      completion = await client.chat.completions.create({
        model: fallbackModel,
        ...completionConfig,
      })
    }

    const fullText = completion.choices[0]?.message?.content || ""
    const structuredDetail = parseStructuredDetail(fullText)

    if (structuredDetail) {
      return jsonResponse(request, {
        success: true,
        ...structuredDetail,
        fullText,
      })
    }

    const tipsMatch = fullText.match(/###\s*(?:小贴士|Tips)[：:]\s*([\s\S]+)$/i)
    const tips = tipsMatch?.[1]?.trim()
    const stepsText = tips
      ? fullText.replace(/###\s*(?:小贴士|Tips)[：:][\s\S]+$/i, "").trim()
      : fullText
    const steps = parseSteps(stepsText)

    return jsonResponse(request, {
      success: true,
      steps,
      tips,
      fullText,
    })
  } catch (error) {
    return handleApiError(request, error)
  }
}

export async function GET(request: NextRequest) {
  const hasKey = Boolean(process.env.AI_API_KEY)

  return jsonResponse(request, {
    status: "ok",
    mode: hasKey ? "ai" : "local",
    description: hasKey ? "AI 生成烹饪步骤" : "使用本地菜谱数据",
  })
}
