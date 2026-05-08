import { NextRequest } from "next/server"

import { jsonResponse, optionsResponse } from "@/lib/server/http"
import { createServerOpenAIClient } from "@/lib/server/openai"

interface DetailRequest {
  recipeName: string
  mainIngredients: string[]
  availableIngredients: string[]
}

interface ParsedStep {
  order: number
  description: string
}

const DEFAULT_TEXT_MODEL = "qwen-plus"

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

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<DetailRequest>
    const recipeName = typeof body.recipeName === "string" ? body.recipeName.trim() : ""
    const mainIngredients = Array.isArray(body.mainIngredients) ? body.mainIngredients : []
    const availableIngredients = Array.isArray(body.availableIngredients)
      ? body.availableIngredients
      : []

    if (!recipeName) {
      return jsonResponse(
        request,
        { success: false, error: "缺少菜谱名称" },
        { status: 400 }
      )
    }

    if (!process.env.AI_API_KEY) {
      return jsonResponse(
        request,
        { success: false, error: "未配置 AI_API_KEY，无法生成菜谱步骤" },
        { status: 503 }
      )
    }

    const client = createServerOpenAIClient()
    const model = process.env.TEXT_MODEL_NAME || DEFAULT_TEXT_MODEL
    const ingredientList = formatIngredients(availableIngredients, mainIngredients)

    const prompt =
      "你是一个经验丰富的中国厨师。请为「" +
      recipeName +
      "」生成详细的烹饪步骤。\n\n" +
      "现有食材状态：\n" +
      ingredientList +
      "\n\n" +
      "要求：\n" +
      "1. 根据现有食材，生成 4-6 个清晰明确的烹饪步骤\n" +
      "2. 每一步要具体说明操作和火候\n" +
      "3. 如果有缺少的食材，在步骤中提醒用户准备\n" +
      "4. 语言简洁生动，像大厨在指导\n\n" +
      "格式要求：\n" +
      "- 每一步单独一行\n" +
      "- 以数字序号开头（如 1. 热锅凉油...）\n" +
      "- 步骤输出完成后，另起一行输出 ### 小贴士： 开头的小贴士（1-2句话，简短实用）\n\n" +
      "示例格式：\n" +
      "1. 热锅凉油，倒入蛋液\n" +
      "2. 鸡蛋凝固后盛出备用\n" +
      "3. 锅中再加少许油，放入番茄块翻炒出汁\n" +
      "4. 加入鸡蛋，调入盐翻炒均匀\n" +
      "### 小贴士：番茄炒至微微出汁时口感最佳，避免过度翻炒。"

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "你是一个专业的中餐厨师，擅长用简洁清晰的语言指导烹饪。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const fullText = completion.choices[0]?.message?.content || ""
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
    return jsonResponse(
      request,
      {
        success: false,
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    )
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
