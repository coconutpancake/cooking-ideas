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
function normalizeRecipeText(value: string): string {
  return value.replace(/\s/g, "").toLowerCase()
}

function usuallyNeedsCookingOil(recipeName: string): boolean {
  return /炒|煎|炸|爆|煸|烧|干锅|香辣|肉丝|肉片|鸡丁/.test(recipeName)
}

function includesCookingOil(seasonings: IngredientAmount[]): boolean {
  return seasonings.some((item) => /油|食用油/.test(item.name))
}

function formatIngredients(availableIngredients: string[], allIngredients: string[]): string {
  const availableSet = new Set(availableIngredients.map((item) => item.toLowerCase()))

  return allIngredients
    .map((ingredient) =>
      `${ingredient}${availableSet.has(ingredient.toLowerCase()) ? " [已有]" : " [缺少]"}`
    )
    .join("、")
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
      const rawAmount = record.amount ?? record.quantity ?? record.qty
      const amount = typeof rawAmount === "string" ? rawAmount.trim() : ""

      return name && amount ? { name, amount } : null
    })
    .filter((item): item is IngredientAmount => Boolean(item))
}

function parseStructuredIngredients(
  content: string
): Pick<StructuredRecipeDetail, "mainIngredients" | "seasonings"> | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    return null
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    const mainIngredients = parseIngredientAmounts(parsed.mainIngredients)
    const seasonings = parseIngredientAmounts(parsed.seasonings)

    if (mainIngredients.length === 0 || seasonings.length === 0) {
      return null
    }

    return {
      mainIngredients,
      seasonings,
    }
  } catch {
    return null
  }
}

function parseStructuredSteps(content: string): Pick<StructuredRecipeDetail, "steps" | "tips"> | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    return null
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
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
    const tips =
      typeof parsed.tips === "string"
        ? parsed.tips.trim()
        : Array.isArray(parsed.tips)
          ? parsed.tips.filter((item): item is string => typeof item === "string").join("；")
          : undefined

    if (steps.length === 0) {
      return null
    }

    return {
      steps,
      tips,
    }
  } catch {
    return null
  }
}

function parseStructuredDetail(content: string): StructuredRecipeDetail | null {
  const ingredients = parseStructuredIngredients(content)
  const steps = parseStructuredSteps(content)

  if (!ingredients || !steps) {
    return null
  }

  return {
    ...ingredients,
    ...steps,
  }
}

function isStructuredDetailRelevant(
  detail: StructuredRecipeDetail,
  mainIngredients: string[],
  recipeName: string
): boolean {
  if (detail.mainIngredients.length === 0 || detail.steps.length === 0) {
    return false
  }

  if (usuallyNeedsCookingOil(recipeName) && !includesCookingOil(detail.seasonings)) {
    return false
  }

  const expectedNames = mainIngredients.map(normalizeRecipeText).filter(Boolean)
  if (expectedNames.length === 0) {
    return true
  }

  const returnedNames = detail.mainIngredients.map((item) => normalizeRecipeText(item.name))
  const returnedText = normalizeRecipeText(
    [
      ...detail.mainIngredients.map((item) => item.name),
      ...detail.steps.map((step) => step.description),
    ].join(" ")
  )

  return expectedNames.every(
    (name) =>
      returnedNames.some((returnedName) => returnedName.includes(name) || name.includes(returnedName)) ||
      returnedText.includes(name)
  )
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
    const { recipeName, mainIngredients, seasonings, availableIngredients, detailStage } = body

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
    const requestCompletion = async (nextPrompt: string, nextStage: "full" | "ingredients" | "steps") => {
      const completionConfig = {
        messages: [
          {
            role: "system" as const,
            content:
              nextStage === "ingredients"
                ? "你是家常菜厨师，只生成食材和调料用量的 JSON。调料和辅料优先使用家庭厨房计量单位，普通用油写适量。"
                : nextStage === "steps"
                  ? "你是家常菜厨师，只生成做法步骤和小贴士的 JSON。"
                  : "你是家常菜厨师，必须严格按照菜名动态生成菜谱，只返回可解析 JSON。",
          },
          { role: "user" as const, content: nextPrompt },
        ],
        temperature: 0.2,
        max_tokens: nextStage === "full" ? 720 : 420,
        response_format: { type: "json_object" as const },
        extra_body: { thinking: { type: "disabled" } },
      }

      try {
        return await client.chat.completions.create({
          model,
          ...completionConfig,
        })
      } catch (error) {
        if (model === fallbackModel) {
          throw error
        }

        return client.chat.completions.create({
          model: fallbackModel,
          ...completionConfig,
        })
      }
    }

    const retryOnce = async <T>(
      nextStage: "full" | "ingredients" | "steps",
      initialPrompt: string,
      parseResult: (text: string) => T | null,
      retrySuffix: string,
    ): Promise<{ text: string; result: T } | null> => {
      const firstCompletion = await requestCompletion(initialPrompt, nextStage)
      const firstText = firstCompletion.choices[0]?.message?.content || ""
      const firstParsed = parseResult(firstText)
      if (firstParsed) {
        return { text: firstText, result: firstParsed }
      }

      const secondCompletion = await requestCompletion(initialPrompt + retrySuffix, nextStage)
      const secondText = secondCompletion.choices[0]?.message?.content || ""
      const secondParsed = parseResult(secondText)
      if (secondParsed) {
        return { text: secondText, result: secondParsed }
      }

      return null
    }

    if (detailStage === "ingredients") {
      const ingredientPrompt =
        `菜名=${recipeName}；份量=2人份。\n` +
        `主食材=${ingredientList}；调料候选=${seasoningText}。\n` +
        "只返回 JSON 对象，且只能包含 mainIngredients、seasonings 两个键。\n" +
        "mainIngredients/seasonings 必须是 {name,amount} 数组。主食材和调料的种类、用量都要按菜名动态生成，不能套模板；主食材用量要真实；调料和辅料优先用家庭单位，如一汤匙、半汤匙、一茶匙、半茶匙、少许、适量、一小把、2瓣、3片，除非特别必要，不要把调料写成克数；如果这道菜通常需要炒、煎、爆香或热锅放油，seasonings 必须包含食用油，普通家常菜油量写“适量”，只有油炸、半煎炸等特殊用油菜才写具体油量。"

      const parsed = await retryOnce(
        "ingredients",
        ingredientPrompt,
        (text) => {
          const ingredients = parseStructuredIngredients(text)
          if (!ingredients) {
            return null
          }

          const hasRequiredOil =
            !usuallyNeedsCookingOil(recipeName) || includesCookingOil(ingredients.seasonings)

          return ingredients.mainIngredients.length > 0 &&
            ingredients.seasonings.length > 0 &&
            hasRequiredOil
            ? ingredients
            : null
        },
        "\n上一次输出不符合要求，请重新生成。必须只输出 JSON，只包含 mainIngredients 和 seasonings 两个键，且两者都不能为空；如果菜名通常需要用油，seasonings 必须包含食用油，普通油量写“适量”。",
      )

      if (!parsed) {
        return jsonResponse(
          request,
          { success: false, error: "食材和调料生成失败，请稍后重试" },
          { status: 502 }
        )
      }

      return jsonResponse(request, {
        success: true,
        ...parsed.result,
        fullText: parsed.text,
      })
    }

    if (detailStage === "steps") {
      const stepsPrompt =
        `菜名=${recipeName}；份量=2人份。\n` +
        `主食材=${ingredientList}；调料候选=${seasoningText}。\n` +
        "只返回 JSON 对象，且只能包含 steps、tips 两个键。\n" +
        "steps 必须是 {order,description} 数组。steps 数组长度由菜品复杂度自己决定，少则 3-4 步，多则 5-7 步，不要固定步数；每一步尽量简洁具体，只在必要时加括号提示；tips 一句话。"

      const parsed = await retryOnce(
        "steps",
        stepsPrompt,
        (text) => {
          const steps = parseStructuredSteps(text)
          if (!steps) {
            return null
          }

          return steps.steps.length > 0 ? steps : null
        },
        "\n上一次输出不符合要求，请重新生成。必须只输出 JSON，只包含 steps 和 tips 两个键，steps 不能为空，长度按菜品复杂度决定。",
      )

      if (!parsed) {
        return jsonResponse(
          request,
          { success: false, error: "做法步骤生成失败，请稍后重试" },
          { status: 502 }
        )
      }

      return jsonResponse(request, {
        success: true,
        ...parsed.result,
        fullText: parsed.text,
      })
    }

    const fullPrompt =
      `菜名=${recipeName}；份量=2人份。\n` +
      `主食材=${ingredientList}；调料候选=${seasoningText}。\n` +
      "只返回 JSON 对象，且只能包含 mainIngredients、seasonings、steps、tips 四个键。\n" +
      "mainIngredients/seasonings 必须是 {name,amount} 数组，steps 必须是 {order,description} 数组。\n" +
      "硬性要求：完全按菜名动态生成，不能套模板或换菜；主食材用量要按真实两人份估计，不能偏少；调料种类和用量也要结合菜名动态判断，调料和辅料优先用家庭单位，如一汤匙、半汤匙、一茶匙、半茶匙、少许、适量、一小把、2瓣、3片，除非特别必要，不要把调料写成克数；如果步骤需要炒、煎、爆香或热锅放油，seasonings 必须包含食用油，普通家常菜油量写“适量”，只有油炸、半煎炸等特殊用油菜才写具体油量；steps 数组长度由菜品复杂度自己决定，少则 3-4 步，多则 5-7 步，不要固定步数；每一步尽量简洁具体，只在必要时加括号提示；tips 一句话。"

    const parsed = await retryOnce(
      "full",
      fullPrompt,
      (text) => {
        const structuredDetail = parseStructuredDetail(text)
        if (!structuredDetail || !isStructuredDetailRelevant(structuredDetail, mainIngredients, recipeName)) {
          return null
        }

        return structuredDetail
      },
      "\n上一次输出不符合要求，请重新生成。必须只输出 JSON，mainIngredients、seasonings、steps、tips 都不能为空，steps 长度由菜品复杂度决定，不要固定步数，不要写模板，不要换菜。",
    )

    if (parsed) {
      return jsonResponse(request, {
        success: true,
        ...parsed.result,
        fullText: parsed.text,
      })
    }

    return jsonResponse(
      request,
      { success: false, error: "菜谱生成失败，请稍后重试" },
      { status: 502 }
    )
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
