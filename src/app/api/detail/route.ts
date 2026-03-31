import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// ============================================
// 菜谱详情 API - AI 生成烹饪步骤
// ============================================

interface DetailRequest {
  recipeName: string
  mainIngredients: string[]
  availableIngredients: string[]
}

function createOpenAIClient(): OpenAI {
  const apiKey = process.env.AI_API_KEY
  const baseURL = process.env.AI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1"

  if (!apiKey) {
    throw new Error("未配置 AI_API_KEY")
  }

  return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: false,
  })
}

function formatIngredients(available: string[], all: string[]): string {
  const availableSet = new Set(available.map((i) => i.toLowerCase()))
  const result: string[] = []

  for (const ing of all) {
    const isAvailable = availableSet.has(ing.toLowerCase())
    result.push(`${ing}${isAvailable ? " [已有]" : " [缺少]"}`)
  }

  return result.join("、")
}

interface ParsedStep {
  order: number
  description: string
}

function parseSteps(text: string): ParsedStep[] {
  const steps: ParsedStep[] = []
  const lines = text.split("\n").filter((line) => line.trim())

  let order = 1
  for (const line of lines) {
    const cleaned = line
      .replace(/^[1-9][\.、]?\s*/, "")
      .replace(/^第[一二三四五六七八九十百千万\d]+[步章节个]/, "")
      .trim()

    if (cleaned.length > 5) {
      steps.push({ order, description: cleaned })
      order++
    }
  }

  if (steps.length === 0 && text.trim()) {
    steps.push({ order: 1, description: text.trim() })
  }

  return steps
}

// ============================================
// API Route Handler - 非流式响应
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: DetailRequest = await request.json()
    const { recipeName, mainIngredients, availableIngredients } = body

    if (!recipeName) {
      return NextResponse.json(
        { success: false, error: "缺少菜谱名称" },
        { status: 400 }
      )
    }

    console.log("[Detail API] 生成步骤，菜谱:", recipeName)
    console.log("[Detail API] 主食材:", mainIngredients)
    console.log("[Detail API] 已有食材:", availableIngredients)

    // 没有 API Key，使用本地步骤
    if (!process.env.AI_API_KEY) {
      console.log("[Detail API] 无 API Key，使用本地数据")

      const { getRecipeByTitle, getRecipeById } = await import("@/lib/recipes")
      const recipe = getRecipeByTitle(recipeName) || getRecipeById(recipeName)

      if (recipe && recipe.steps) {
        console.log("[Detail API] 返回本地步骤，步数:", recipe.steps.length)
        return NextResponse.json({
          success: true,
          steps: recipe.steps,
          fullText: recipe.steps.map((s) => `${s.order}. ${s.description}`).join("\n"),
        })
      }

      return NextResponse.json(
        { success: false, error: "本地无此菜谱步骤" },
        { status: 404 }
      )
    }

    // 有 API Key，使用 AI 生成
    const client = createOpenAIClient()
    const model = process.env.TEXT_MODEL_NAME || "qwen-plus"
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

    console.log("[Detail API] 调用 AI 生成（等待完成）...")

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

    // 提取小贴士
    let tips: string | undefined
    const tipsMatch = fullText.match(/###\s*小贴士[：:]\s*([\s\S]+)$/)
    if (tipsMatch) {
      tips = tipsMatch[1].trim()
    }

    // 提取纯步骤文本
    const stepsText = tips
      ? fullText.replace(/###\s*小贴士[：:][\s\S]+$/, "").trim()
      : fullText
    const steps = parseSteps(stepsText)

    console.log(
      "[Detail API] AI 生成完成，步骤数:",
      steps.length,
      "小贴士:",
      tips?.slice(0, 30) || "无"
    )
    console.log("[Detail API] Raw response:", fullText.slice(0, 200))

    return NextResponse.json({
      success: true,
      steps,
      tips,
      fullText,
    })
  } catch (error) {
    console.error(
      "[Detail API] 错误:",
      error instanceof Error ? error.message : String(error)
    )

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
  const hasKey = !!process.env.AI_API_KEY
  return NextResponse.json({
    status: "ok",
    mode: hasKey ? "ai" : "local",
    description: hasKey ? "AI 生成烹饪步骤" : "使用本地菜谱数据",
  })
}
