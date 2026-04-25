import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// ============================================
// 类型定义
// ============================================

interface AIGeneratedRecipe {
  title: string
  emoji: string                // Emoji 配图（如 🍅🍳）
  mainIngredients: string[]   // AI 推断的该菜谱所需主食材
  seasonings: string[]         // AI 推断的该菜谱所需调料
  cookingMethod?: string       // 烹饪方式（可选）
  cookingTime?: number         // 烹饪时间分钟（可选）
}

interface Recommendation {
  recipeId: string
  title: string
  emoji: string
  cookingMethod: string
  matchingScore: number
  availableMainIngredients: string[]
  missingMainIngredients: string[]
  isAllAvailable: boolean
  seasonings: string[]
  cookingTime: number
}

interface RecommendResponse {
  success: boolean
  data?: {
    recommendations: Recommendation[]
    totalCandidates: number
  }
  error?: string
}

// ============================================
// 辅助函数
// ============================================

function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, "")
    .trim()
}

function ingredientMatches(userIngredient: string, recipeIngredient: string): boolean {
  const userNorm = normalizeIngredientName(userIngredient)
  const recipeNorm = normalizeIngredientName(recipeIngredient)

  if (userNorm === recipeNorm) return true
  if (userNorm.includes(recipeNorm) || recipeNorm.includes(userNorm)) return true

  const aliases: Record<string, string[]> = {
    番茄: ["西红柿"],
    西红柿: ["番茄"],
    鸡蛋: ["蛋"],
    蛋: ["鸡蛋"],
    葱: ["大葱", "小葱", "香葱"],
    大葱: ["葱"],
    小葱: ["葱"],
    香葱: ["葱"],
    土豆: ["马铃薯"],
    马铃薯: ["土豆"],
    豆腐: ["嫩豆腐", "老豆腐", "北豆腐", "南豆腐"],
    嫩豆腐: ["豆腐"],
    老豆腐: ["豆腐"],
    北豆腐: ["豆腐"],
    南豆腐: ["豆腐"],
    牛腩: ["牛肉", "牛肋条", "牛腱子", "牛里脊"],
    牛肋条: ["牛腩", "牛肉", "牛腱子", "牛里脊"],
    牛腱子: ["牛腩", "牛肉", "牛肋条", "牛里脊"],
    牛里脊: ["牛腩", "牛肉", "牛肋条", "牛腱子"],
    牛肉: ["牛腩", "牛肋条", "牛腱子", "牛里脊"],
    猪肉: ["五花肉", "里脊肉", "排骨", "猪蹄"],
    五花肉: ["猪肉", "排骨", "里脊肉"],
    里脊肉: ["猪肉", "五花肉"],
    排骨: ["猪肉", "五花肉"],
    猪蹄: ["猪肉"],
    羊肉: ["羊排", "羊腿"],
    羊排: ["羊肉", "羊腿"],
    羊腿: ["羊肉", "羊排"],
    鸡翅: ["鸡胸肉", "鸡腿肉", "鸡肉"],
    鸡胸肉: ["鸡翅", "鸡腿肉", "鸡肉"],
    鸡腿肉: ["鸡翅", "鸡胸肉", "鸡肉"],
    鸡肉: ["鸡翅", "鸡胸肉", "鸡腿肉"],
    大虾: ["虾仁", "虾", "海虾"],
    虾仁: ["大虾", "虾", "海虾"],
    虾: ["大虾", "虾仁", "海虾"],
    海虾: ["大虾", "虾仁", "虾"],
    西兰花: ["绿菜花"],
    绿菜花: ["西兰花"],
    卷心菜: ["包菜", "圆白菜"],
    包菜: ["卷心菜", "圆白菜"],
    圆白菜: ["卷心菜", "包菜"],
  }

  const userAliases = aliases[userNorm] || []
  const recipeAliases = aliases[recipeNorm] || []

  for (const alias of userAliases) {
    if (alias === recipeNorm) return true
  }
  for (const alias of recipeAliases) {
    if (alias === userNorm) return true
  }

  return false
}

// ============================================
// 计算单个菜谱的匹配度
// ============================================

interface MatchResult {
  recipe: AIGeneratedRecipe
  availableMainIngredients: string[]
  missingMainIngredients: string[]
  matchingScore: number
  isAllAvailable: boolean
  cookingMethod: string
  cookingTime: number
}

function calculateMatch(recipe: AIGeneratedRecipe, userIngredients: string[]): MatchResult {
  const availableMainIngredients: string[] = []
  const missingMainIngredients: string[] = []

  for (const mainIng of recipe.mainIngredients) {
    const found = userIngredients.some((userIng) =>
      ingredientMatches(userIng, mainIng)
    )

    if (found) {
      availableMainIngredients.push(mainIng)
    } else {
      missingMainIngredients.push(mainIng)
    }
  }

  const matchingScore =
    recipe.mainIngredients.length > 0
      ? availableMainIngredients.length / recipe.mainIngredients.length
      : 0

  const isAllAvailable = missingMainIngredients.length === 0

  return {
    recipe,
    availableMainIngredients,
    missingMainIngredients,
    matchingScore,
    isAllAvailable,
    cookingMethod: recipe.cookingMethod || "炒",
    cookingTime: recipe.cookingTime || 20,
  }
}

function sortRecommendations(results: MatchResult[]): MatchResult[] {
  return results.sort((a, b) => {
    // 规则1: 完全匹配优先
    if (a.isAllAvailable !== b.isAllAvailable) {
      return a.isAllAvailable ? -1 : 1
    }
    // 规则2: 匹配度高优先
    if (Math.abs(a.matchingScore - b.matchingScore) > 0.01) {
      return b.matchingScore - a.matchingScore
    }
    // 规则3: 缺少主食材少优先
    if (a.missingMainIngredients.length !== b.missingMainIngredients.length) {
      return a.missingMainIngredients.length - b.missingMainIngredients.length
    }
    // 规则4: 烹饪时间短优先
    return a.cookingTime - b.cookingTime
  })
}

// ============================================
// JSON 解析（带容错，单个失败不影響整体）
// ============================================

function parseAIResponse(content: string): AIGeneratedRecipe[] {
  const results: AIGeneratedRecipe[] = []
  const seenTitles = new Set<string>()

  // 清理 content 中的 markdown 代码块
  const cleaned = content
    .replace(/```(?:json)?\s*/g, "")
    .replace(/```\s*/g, "")
    .trim()

  // 策略1：直接 JSON.parse（整体数组）
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (tryAddRecipe(item, results, seenTitles)) break // 遇到解析失败就停止
      }
    }
    if (results.length >= 10) return results.slice(0, 10)
  } catch {}

  // 策略2：提取 JSON 数组 [...]（防止截断）
  const arrayMatches = cleaned.match(/\[[\s\S]*?\]/g)
  if (arrayMatches) {
    for (const arrayStr of arrayMatches) {
      try {
        const parsed = JSON.parse(arrayStr)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (tryAddRecipe(item, results, seenTitles)) {
              if (results.length >= 10) return results.slice(0, 10)
            }
          }
        }
      } catch {
        // 当前数组解析失败，尝试下一个
      }
    }
    if (results.length >= 10) return results.slice(0, 10)
  }

  // 策略3：逐个提取 {...} 对象并合并为数组
  // 匹配所有可能的 JSON 对象
  const objectStrings = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || []
  for (const objStr of objectStrings) {
    try {
      const obj = JSON.parse(objStr)
      if (tryAddRecipe(obj, results, seenTitles)) {
        if (results.length >= 10) return results.slice(0, 10)
      }
    } catch {
      // 单个对象解析失败，跳过
    }
  }

  if (results.length >= 10) return results.slice(0, 10)

  // 策略4：纯文本行解析（备用保底）
  // 格式如：1. 菜名 主食材:xxx,xxx
  const lines = cleaned.split(/[\n\r]/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 尝试提取 "菜名 主食材:xxx" 格式
    const match = trimmed.match(/^[0-9a-zA-Z\u4e00-\u9fa5]+[\.、)）]\s*([^\s\d][^\s:]{0,20})/)
    if (match && !seenTitles.has(match[1])) {
      results.push({
        title: match[1],
        emoji: "🍽️",
        mainIngredients: [],
        seasonings: [],
      })
      seenTitles.add(match[1])
      if (results.length >= 10) break
    }
  }

  return results.slice(0, 10)
}

// 尝试添加一个解析后的对象到结果数组
// 支持完整 key (title, mainIngredients, seasonings, cookingMethod, cookingTime)
// 也支持简化 key (t, m, s, c, d)
function tryAddRecipe(
  item: unknown,
  results: AIGeneratedRecipe[],
  seenTitles: Set<string>
): boolean {
  if (!item || typeof item !== "object") return false

  const obj = item as Record<string, unknown>

  // 提取 title（支持完整 key 和简化 key）
  const rawTitle = (obj.title ?? obj.t ?? "") as string
  const title = typeof rawTitle === "string" ? rawTitle.trim() : null
  if (!title || title.length < 2 || title.length > 30) return false

  // 跳过重复标题
  if (seenTitles.has(title)) return false

  // 提取 mainIngredients（支持完整 key 和简化 key）
  const rawMain = obj.mainIngredients ?? obj.m ?? []
  let mainIngredients: string[] = []

  if (Array.isArray(rawMain)) {
    mainIngredients = rawMain
      .filter((ing): ing is string => typeof ing === "string" && ing.length >= 1 && ing.length <= 20)
      .map(ing => ing.trim())
  } else if (typeof rawMain === "string") {
    mainIngredients = rawMain
      .split(/[,，、]/)
      .map(s => s.trim())
      .filter(s => s.length >= 1 && s.length <= 20)
  }

  if (mainIngredients.length === 0) return false

  // 提取 seasonings（支持完整 key 和简化 key）
  const rawSeasonings = obj.seasonings ?? obj.s ?? []
  const seasonings: string[] = Array.isArray(rawSeasonings)
    ? (rawSeasonings as unknown[]).filter((s): s is string => typeof s === "string" && s.length >= 1 && s.length <= 20)
    : []

  // 提取 cookingMethod（支持完整 key 和简化 key）
  const cookingMethod = (obj.cookingMethod ?? obj.c ?? "炒") as string

  // 提取 cookingTime（支持完整 key 和简化 key，用 d 避免与 title 的 t 冲突）
  const cookingTime = (obj.cookingTime ?? obj.d ?? 15) as number

  // 提取 emoji（支持完整 key 和简化 key e）
  const emoji = (obj.emoji ?? obj.e ?? "🍽️") as string

  results.push({
    title,
    emoji: typeof emoji === "string" && emoji.length <= 4 ? emoji : "🍽️",
    mainIngredients,
    seasonings,
    cookingMethod: typeof cookingMethod === "string" ? cookingMethod : "炒",
    cookingTime: typeof cookingTime === "number" ? cookingTime : 15,
  })
  seenTitles.add(title)
  return false // 返回 false 表示继续添加，不停止
}

// ============================================
// OpenAI 客户端
// ============================================

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

// ============================================
// API Route Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ingredients } = body

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: "缺少食材列表" },
        { status: 400 }
      )
    }

    console.log("[Recommend API] 收到请求，用户食材:", ingredients)

    // 必须有 API Key
    if (!process.env.AI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "未配置 AI_API_KEY，无法生成推荐" },
        { status: 500 }
      )
    }

    const client = createOpenAIClient()
    const model = process.env.TEXT_MODEL_NAME || "qwen-plus"

    const ingredientList = ingredients.join("、")

    // 强制多样性 Prompt：必须恰好 10 道，同一主食材不超过 2 道
    const prompt = "你是一个顶级中餐厨师。请严格根据用户食材「" + ingredientList + "」，生成恰好10道菜谱推荐。\n\n【硬性约束 - 违反将被拒绝】：\n1. 恰好10道菜，不多不少\n2. 同一主食材（如：排骨、鸡蛋、番茄）最多出现2次\n3. 必须包含：至少2道纯素菜、至少3道荤素搭配、至少1道蛋类菜\n4. 必须覆盖不同烹饪方式：炒、煮、蒸、烤、炸、凉拌\n\n【简化JSON格式 - 严格按此格式】：\n[{\"t\":\"菜名\",\"e\":\"🍅🍳\",\"m\":[\"主食材1\",\"主食材2\"],\"s\":[\"调料1\"],\"c\":\"炒\",\"d\":15},...]\n\n字段说明：t=菜名(必填), e=Emoji配图(必填，1-2个emoji), m=主食材数组(必填且>=1), s=调料数组(选填), c=烹饪方式(选填默认炒), d=时间分钟(选填默认15)\n\n只输出JSON数组，不要任何其他文字。数组必须是完整的10个对象。"

    console.log("[Recommend API] 调用 AI 生成多样化推荐...")

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "你是一个专业中餐厨师。你必须严格返回恰好10道菜谱，主食材不能重复超过2次。输出必须是完整有效的JSON数组。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    })

    const aiResponse = response.choices?.[0]?.message?.content || ""
    console.log("[Recommend API] AI 返回 (原始):", aiResponse.slice(0, 500))

    // 解析 AI 返回的 JSON
    const parsedRecipes = parseAIResponse(aiResponse)
    console.log("[Recommend API] 解析出菜谱数量:", parsedRecipes.length)

    if (parsedRecipes.length === 0) {
      return NextResponse.json(
        { success: false, error: "AI 返回格式解析失败，请重试" },
        { status: 500 }
      )
    }

    // 计算每个菜谱的匹配度
    const matchResults: MatchResult[] = parsedRecipes.map(recipe =>
      calculateMatch(recipe, ingredients)
    )

    // 硬过滤：剔除匹配度为 0 的菜谱
    const filteredResults = matchResults.filter(r => r.matchingScore > 0)

    if (filteredResults.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有找到匹配的菜谱，请尝试添加其他食材" },
        { status: 404 }
      )
    }

    // 排序
    const sortedResults = sortRecommendations(filteredResults)

    // 截取前 10 个
    const top10 = sortedResults.slice(0, 10)

    // 构建返回结果
    const recommendations: Recommendation[] = top10.map((r, index) => ({
      recipeId: `ai-${Date.now()}-${index}`,
      title: r.recipe.title,
      emoji: r.recipe.emoji || "🍽️",
      cookingMethod: r.cookingMethod,
      matchingScore: Math.round(r.matchingScore * 100) / 100,
      availableMainIngredients: r.availableMainIngredients,
      missingMainIngredients: r.missingMainIngredients,
      isAllAvailable: r.isAllAvailable,
      seasonings: r.recipe.seasonings,
      cookingTime: r.cookingTime,
    }))

    console.log("[Recommend API] 推荐结果:", recommendations.map(r => `${r.title}(${r.matchingScore})`).join(", "))

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        totalCandidates: filteredResults.length,
      },
    })
  } catch (error) {
    console.error("[Recommend API] 错误:", error instanceof Error ? error.message : String(error))

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
    mode: hasKey ? "ai-json" : "no-api-key",
    description: hasKey ? "AI 生成多样化菜谱推荐（JSON 格式）" : "需要配置 AI_API_KEY",
  })
}
