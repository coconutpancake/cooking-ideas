import { NextRequest } from "next/server"

import { jsonResponse, optionsResponse } from "@/lib/server/http"
import { createServerOpenAIClient } from "@/lib/server/openai"

interface IngredientItem {
  name: string
  amount?: string
}

const SYSTEM_PROMPT =
  "你是一个没有感情的食材提取程序。只提取图片中清晰可见的、完整的食材。看不清或不确定的物体一律丢弃，绝不猜测。" +
  '绝不输出任何多余的解释性文字。只输出要求的 JSON 格式。禁止输出：油、盐、酱、醋等瓶装调料、厨具、餐具、桌布等非食材。JSON格式：{"ingredients":[{"name":"食材名称","amount":"份量"}]}'

const DEFAULT_VISION_MODEL = "qwen-vl-plus"

function parseIngredients(content: string): IngredientItem[] | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    return null
  }

  const parsed = JSON.parse(jsonMatch[0]) as { ingredients?: IngredientItem[] }
  const ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : []
  const seen = new Set<string>()

  return ingredients.filter((item) => {
    if (!item || typeof item.name !== "string") {
      return false
    }

    const normalizedName = item.name.trim()
    if (!normalizedName || seen.has(normalizedName)) {
      return false
    }

    seen.add(normalizedName)
    item.name = normalizedName
    if (typeof item.amount === "string") {
      item.amount = item.amount.trim()
    }
    return true
  })
}

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const image = typeof body?.image === "string" ? body.image : ""

    if (!image) {
      return jsonResponse(
        request,
        { success: false, error: "缺少图片数据" },
        { status: 400 }
      )
    }

    if (!image.startsWith("data:image/")) {
      return jsonResponse(
        request,
        { success: false, error: "图片格式无效" },
        { status: 400 }
      )
    }

    if (!process.env.AI_API_KEY) {
      return jsonResponse(
        request,
        { success: false, error: "未配置 API Key，请联系管理员配置阿里云通义千问 API" },
        { status: 500 }
      )
    }

    const client = createServerOpenAIClient()
    const model = process.env.VISION_MODEL_NAME || DEFAULT_VISION_MODEL

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${SYSTEM_PROMPT}\n\n分析这张图片，提取所有清晰可见的食材。`,
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    })

    const content = response.choices?.[0]?.message?.content

    if (!content) {
      return jsonResponse(
        request,
        { success: false, error: "API 返回内容为空" },
        { status: 500 }
      )
    }

    let ingredients: IngredientItem[] | null
    try {
      ingredients = parseIngredients(content)
    } catch {
      return jsonResponse(
        request,
        { success: false, error: "JSON 解析失败" },
        { status: 500 }
      )
    }

    if (!ingredients) {
      return jsonResponse(
        request,
        { success: false, error: "无法解析识别结果，格式错误" },
        { status: 500 }
      )
    }

    return jsonResponse(request, {
      success: true,
      data: {
        ingredients,
        imageId: `img_${Date.now()}`,
        message: `成功识别出 ${ingredients.length} 种食材`,
      },
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
    provider: "aliyun-qwen",
    model: process.env.VISION_MODEL_NAME || DEFAULT_VISION_MODEL,
    configured: hasKey,
    mode: hasKey ? "real" : "not_configured",
  })
}
