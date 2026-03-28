import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// 食材识别结果格式 (来自 SDD)
interface IngredientItem {
  name: string
  amount?: string
}

interface VisionResponse {
  success: boolean
  data?: {
    ingredients: IngredientItem[]
    imageId: string
    message: string
  }
  error?: string
}

// 系统级指令 - 严格约束模型行为
const SYSTEM_PROMPT = `你是一个没有感情的食材提取程序。只提取图片中清晰可见的、完整的食材。看不清或不确定的物体一律丢弃，绝不猜测。绝不输出任何多余的解释性文字。只输出要求的 JSON 格式。禁止输出：油、盐、酱、醋等瓶装调料、厨具、餐具、桌布等非食材。JSON格式：{"ingredients":[{"name":"食材名称","amount":"份量"}]}`

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

    // 检查是否配置了 API Key
    if (!process.env.AI_API_KEY) {
      console.error("[Vision API] ❌ 未配置 AI_API_KEY")
      return NextResponse.json(
        { success: false, error: "未配置 API Key，请联系管理员配置阿里云通义千问 API" },
        { status: 500 }
      )
    }

    const client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
      dangerouslyAllowBrowser: false,
    })

    const model = process.env.VISION_MODEL_NAME || "qwen-vl-plus"

    console.log("========================================")
    console.log("[Vision API] 📤 发送请求:")
    console.log("  - Model:", model)
    console.log("  - BaseURL:", process.env.AI_BASE_URL)
    console.log("  - Image Size:", image.length, "bytes")
    console.log("========================================")

    // 阿里云通义千问兼容格式：把 system prompt 放在 user message 里
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

    console.log("========================================")
    console.log("[Vision API] 📥 Raw Response:")
    console.log("  - Content:", content)
    console.log("  - Finish Reason:", response.choices?.[0]?.finish_reason)
    console.log("========================================")

    if (!content) {
      console.error("[Vision API] ❌ 返回内容为空")
      return NextResponse.json(
        { success: false, error: "API 返回内容为空" },
        { status: 500 }
      )
    }

    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[Vision API] ❌ 无法提取 JSON:", content)
      return NextResponse.json(
        { success: false, error: "无法解析识别结果，格式错误" },
        { status: 500 }
      )
    }

    let parsed: { ingredients?: IngredientItem[] }
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error("[Vision API] ❌ JSON 解析失败:", e)
      return NextResponse.json(
        { success: false, error: "JSON 解析失败" },
        { status: 500 }
      )
    }

    // 去重
    const rawIngredients = parsed.ingredients || []
    const seen = new Set<string>()
    const deduplicated = rawIngredients.filter((item: IngredientItem) => {
      if (seen.has(item.name)) return false
      seen.add(item.name)
      return true
    })

    console.log("[Vision API] ✅ 识别成功:", deduplicated)

    return NextResponse.json({
      success: true,
      data: {
        ingredients: deduplicated,
        imageId: `img_${Date.now()}`,
        message: `成功识别出 ${deduplicated.length} 种食材`,
      },
    })
  } catch (error) {
    console.error("========================================")
    console.error("[Vision API] ❌ 错误:")
    console.error("  -", error instanceof Error ? error.message : String(error))
    console.error("========================================")

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const hasKey = !!process.env.AI_API_KEY
  return NextResponse.json({
    status: "ok",
    provider: "aliyun-qwen",
    model: process.env.VISION_MODEL_NAME || "qwen-vl-plus",
    configured: hasKey,
    mode: hasKey ? "real" : "not_configured",
  })
}
