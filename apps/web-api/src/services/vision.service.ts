import "server-only"

import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions"

import { createServerOpenAIClient } from "@/lib/server/openai"

import { DEFAULT_VISION_MODEL } from "./ai.constants"

export interface IngredientItem {
  name: string
  amount?: string
}

const VISION_SYSTEM_PROMPT =
  "你是一个家用冰箱和厨房照片的食材识别程序。识别真实可食用的食材，包含被塑料袋、保鲜膜或外皮部分遮挡但仍能明确判断的常见食材。" +
  "优先输出生鲜食材和可直接用于做菜的食物。不要识别厨具、餐具、秤、桌面、包装图片、玩具、显示器画面；背景中的罐头、奶粉、饮品、酱料和瓶装调料暂不输出。" +
  '只输出 JSON，不要解释。JSON格式：{"ingredients":[{"name":"食材名称","amount":"份量"}]}'

type MiMoCompletionParams = ChatCompletionCreateParamsNonStreaming & {
  extra_body?: {
    thinking: {
      type: "disabled"
    }
  }
}

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


export async function recognizeIngredientsFromImage(image: string): Promise<{
  ingredients: IngredientItem[]
  imageId: string
  message: string
}> {
  const client = createServerOpenAIClient()
  const model = process.env.VISION_MODEL_NAME || DEFAULT_VISION_MODEL

  const completionParams: MiMoCompletionParams = {
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${VISION_SYSTEM_PROMPT}\n\n分析这张图片，提取所有清晰可见的食材。`,
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
    response_format: { type: "json_object" },
    extra_body: { thinking: { type: "disabled" } },
  }
  const response = await client.chat.completions.create(completionParams)

  const content = response.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("AI vision response content is empty")
  }

  let ingredients: IngredientItem[] | null
  try {
    ingredients = parseIngredients(content)
  } catch (error) {
    throw new Error("Failed to parse AI vision response", { cause: error })
  }

  if (!ingredients) {
    throw new Error("AI vision response format is invalid")
  }

  return {
    ingredients,
    imageId: `img_${Date.now()}`,
    message: `成功识别出 ${ingredients.length} 种食材`,
  }
}
