import { NextRequest, NextResponse } from "next/server"

// 食材识别结果格式 (来自 SDD)
interface IngredientItem {
  name: string
  amount?: string
}

interface VisionResponse {
  success: boolean
  data: {
    ingredients: IngredientItem[]
    imageId: string
    message: string
  }
  error?: string
}

const INGREDIENT_PROMPT = `你是一个专业的食材识别AI。请仔细分析用户上传的图片，识别出图片中所有的食材原料。

## 输出要求
请严格按以下JSON格式返回，只返回JSON，不要有任何其他文字：
{"ingredients":[{"name":"食材名称","amount":"份量或数量"}]}

## 识别规则
1. 只识别可食用的食材原料（蔬菜、肉类、蛋类、豆制品、调味料等）
2. 不要识别厨具、餐具、桌布等非食材物品
3. 如果无法确定份量，amount字段可以省略或填"适量"
4. 食材名称使用中文通用名称
5. 最多返回20种食材，最少返回1种
6. 如果图片中没有任何食材，返回空的ingredients数组：{"ingredients":[]}

请现在分析图片并返回JSON结果。`

/**
 * 调用 OpenAI GPT-4 Vision API
 */
async function callOpenAIVision(
  base64Image: string,
  apiKey: string
): Promise<VisionResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: INGREDIENT_PROMPT,
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("OpenAI 返回内容为空")
  }

  // 解析 JSON 响应
  try {
    // 尝试提取 JSON（可能有 markdown 代码块）
    let jsonStr = content.trim()
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json\n?/, "").replace(/```\n?$/, "")
    }
    const parsed = JSON.parse(jsonStr)

    return {
      success: true,
      data: {
        ingredients: parsed.ingredients || [],
        imageId: `img_${Date.now()}`,
        message: `成功识别出 ${parsed.ingredients?.length || 0} 种食材`,
      },
    }
  } catch (e) {
    throw new Error(`解析 AI 响应失败: ${e instanceof Error ? e.message : "未知错误"}`)
  }
}

/**
 * 调用 Claude Vision API
 */
async function callClaudeVision(
  base64Image: string,
  apiKey: string
): Promise<VisionResponse> {
  const response = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: INGREDIENT_PROMPT,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Image.replace("data:image/jpeg;base64,", "").replace("data:image/png;base64,", ""),
                },
              },
            ],
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text

  if (!content) {
    throw new Error("Claude 返回内容为空")
  }

  try {
    let jsonStr = content.trim()
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json\n?/, "").replace(/```\n?$/, "")
    }
    const parsed = JSON.parse(jsonStr)

    return {
      success: true,
      data: {
        ingredients: parsed.ingredients || [],
        imageId: `img_${Date.now()}`,
        message: `成功识别出 ${parsed.ingredients?.length || 0} 种食材`,
      },
    }
  } catch (e) {
    throw new Error(`解析 AI 响应失败: ${e instanceof Error ? e.message : "未知错误"}`)
  }
}

/**
 * Mock 响应（API 不可用时的兜底）
 */
function getMockResponse(): VisionResponse {
  const possibleIngredients = [
    "西红柿", "鸡蛋", "葱", "蒜", "姜", "青菜", "白菜",
    "土豆", "胡萝卜", "洋葱", "豆腐", "肉末", "辣椒",
    "盐", "油", "生抽", "老抽", "糖", "醋", "番茄酱",
  ]

  const count = Math.floor(Math.random() * 4) + 3
  const shuffled = [...possibleIngredients].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)

  return {
    success: true,
    data: {
      ingredients: selected.map((name) => ({ name, amount: "适量" })),
      imageId: `mock_${Date.now()}`,
      message: `Mock 模式：返回 ${selected.length} 种随机食材`,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { success: false, error: "缺少图片数据" },
        { status: 400 }
      )
    }

    // 验证 Base64 格式
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { success: false, error: "图片格式无效" },
        { status: 400 }
      )
    }

    const provider = process.env.VISION_API_PROVIDER || "openai"
    const apiKey = process.env.OPENAI_API_KEY

    // 如果没有配置 API Key，使用 Mock 响应
    if (!apiKey) {
      console.warn("[Vision API] 未配置 API Key，使用 Mock 响应")
      return NextResponse.json(getMockResponse())
    }

    let result: VisionResponse

    try {
      if (provider === "claude" && process.env.CLAUDE_API_KEY) {
        result = await callClaudeVision(image, process.env.CLAUDE_API_KEY)
      } else {
        result = await callOpenAIVision(image, apiKey)
      }
    } catch (apiError) {
      console.error("[Vision API] API 调用失败:", apiError)
      // API 调用失败时返回 Mock 响应作为兜底
      return NextResponse.json(getMockResponse())
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Vision API] 处理请求失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    )
  }
}

// GET 请求返回 API 状态
export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasClaude = !!process.env.CLAUDE_API_KEY

  return NextResponse.json({
    status: "ok",
    provider: process.env.VISION_API_PROVIDER || "openai",
    configured: {
      openai: hasOpenAI,
      claude: hasClaude,
    },
    mode: hasOpenAI || hasClaude ? "real" : "mock",
  })
}
