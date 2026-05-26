import "server-only"

import { createServerOpenAIClient } from "@/lib/server/openai"

import { DEFAULT_VISION_MODEL } from "./ai.constants"

export interface IngredientItem {
  name: string
  amount?: string
}

const VISION_SYSTEM_PROMPT =
  "你是一个没有感情的食材提取程序。只提取图片中清晰可见的、完整的食材。看不清或不确定的物体一律丢弃，绝不猜测。" +
  '绝不输出任何多余的解释性文字。只输出要求的 JSON 格式。禁止输出：油、盐、酱、醋等瓶装调料、厨具、餐具、桌布等非食材。JSON格式：{"ingredients":[{"name":"食材名称","amount":"份量"}]}'


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

  const response = await client.chat.completions.create({
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
  })

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

