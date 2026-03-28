import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// ============================================
// 类型定义
// ============================================

interface Ingredient {
  name: string
  amount?: string
}

interface Recipe {
  id: string
  title: string
  coverImage: string
  cookingTime: number
  cookingMethod: "炒" | "煮" | "蒸" | "烤" | "炸" | "凉拌" | "其他"
  tags: string[]
  mainIngredients: Ingredient[]   // 主食材（决定性食材）
  seasonings: Ingredient[]       // 调料与辅料（常备品）
}

interface Recommendation {
  recipeId: string
  title: string
  coverImage: string
  cookingMethod: string
  matchingScore: number
  availableMainIngredients: string[]   // 已匹配的主食材
  missingMainIngredients: string[]      // 缺少的主食材
  isAllAvailable: boolean               // 主食材是否全部备齐
  seasonings: string[]                  // 需要的调料（展示用）
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
// 预设菜谱数据库（包含常见家常菜）
// ============================================

const RECIPE_DATABASE: Recipe[] = [
  {
    id: "1",
    title: "番茄炒蛋",
    coverImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    cookingTime: 15,
    cookingMethod: "炒",
    tags: ["家常菜", "快手"],
    mainIngredients: [
      { name: "番茄", amount: "2个" },
      { name: "鸡蛋", amount: "3个" },
    ],
    seasonings: [
      { name: "葱", amount: "适量" },
      { name: "盐", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "2",
    title: "蒜蓉青菜",
    coverImage: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop",
    cookingTime: 10,
    cookingMethod: "炒",
    tags: ["素菜", "健康"],
    mainIngredients: [
      { name: "青菜", amount: "300g" },
    ],
    seasonings: [
      { name: "蒜", amount: "3瓣" },
      { name: "盐", amount: "适量" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "3",
    title: "麻婆豆腐",
    coverImage: "https://images.unsplash.com/photo-1582452932307-f63b7acc463e?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "炒",
    tags: ["川菜", "下饭"],
    mainIngredients: [
      { name: "豆腐", amount: "1块" },
      { name: "肉末", amount: "100g" },
    ],
    seasonings: [
      { name: "豆瓣酱", amount: "1勺" },
      { name: "花椒", amount: "适量" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "4",
    title: "蛋炒饭",
    coverImage: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop",
    cookingTime: 10,
    cookingMethod: "炒",
    tags: ["主食", "快手"],
    mainIngredients: [
      { name: "米饭", amount: "1碗" },
      { name: "鸡蛋", amount: "2个" },
    ],
    seasonings: [
      { name: "葱", amount: "适量" },
      { name: "盐", amount: "适量" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "5",
    title: "红烧肉",
    coverImage: "https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=400&h=300&fit=crop",
    cookingTime: 60,
    cookingMethod: "煮",
    tags: ["硬菜", "下饭"],
    mainIngredients: [
      { name: "五花肉", amount: "500g" },
    ],
    seasonings: [
      { name: "冰糖", amount: "30g" },
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "1勺" },
      { name: "八角", amount: "2个" },
      { name: "桂皮", amount: "1小块" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "6",
    title: "可乐鸡翅",
    coverImage: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop",
    cookingTime: 30,
    cookingMethod: "煮",
    tags: ["肉类", "下饭"],
    mainIngredients: [
      { name: "鸡翅", amount: "8个" },
    ],
    seasonings: [
      { name: "可乐", amount: "1罐" },
      { name: "生抽", amount: "2勺" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "7",
    title: "酸辣土豆丝",
    coverImage: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&h=300&fit=crop",
    cookingTime: 15,
    cookingMethod: "炒",
    tags: ["川菜", "下饭"],
    mainIngredients: [
      { name: "土豆", amount: "2个" },
    ],
    seasonings: [
      { name: "干辣椒", amount: "5个" },
      { name: "醋", amount: "2勺" },
      { name: "盐", amount: "适量" },
      { name: "葱", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "8",
    title: "宫保鸡丁",
    coverImage: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=300&fit=crop",
    cookingTime: 25,
    cookingMethod: "炒",
    tags: ["川菜", "下饭"],
    mainIngredients: [
      { name: "鸡胸肉", amount: "200g" },
      { name: "花生", amount: "50g" },
    ],
    seasonings: [
      { name: "干辣椒", amount: "10个" },
      { name: "花椒", amount: "适量" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "9",
    title: "清蒸鲈鱼",
    coverImage: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "蒸",
    tags: ["海鲜", "清淡"],
    mainIngredients: [
      { name: "鲈鱼", amount: "1条" },
    ],
    seasonings: [
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒸鱼豉油", amount: "2勺" },
    ],
  },
  {
    id: "10",
    title: "蒜蓉生蚝",
    coverImage: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&h=300&fit=crop",
    cookingTime: 15,
    cookingMethod: "蒸",
    tags: ["海鲜"],
    mainIngredients: [
      { name: "生蚝", amount: "6个" },
    ],
    seasonings: [
      { name: "蒜", amount: "2头" },
      { name: "葱", amount: "适量" },
      { name: "盐", amount: "适量" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "11",
    title: "青椒肉丝",
    coverImage: "https://images.unsplash.com/photo-1595743825637-cdafc8ad4173?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "炒",
    tags: ["家常菜", "下饭"],
    mainIngredients: [
      { name: "青椒", amount: "3个" },
      { name: "猪肉", amount: "200g" },
    ],
    seasonings: [
      { name: "盐", amount: "适量" },
      { name: "生抽", amount: "1勺" },
      { name: "淀粉", amount: "适量" },
    ],
  },
  {
    id: "12",
    title: "番茄蛋汤",
    coverImage: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    cookingTime: 15,
    cookingMethod: "煮",
    tags: ["汤类", "家常菜"],
    mainIngredients: [
      { name: "番茄", amount: "2个" },
      { name: "鸡蛋", amount: "2个" },
    ],
    seasonings: [
      { name: "葱", amount: "适量" },
      { name: "盐", amount: "适量" },
      { name: "水", amount: "适量" },
    ],
  },
  {
    id: "13",
    title: "凉拌黄瓜",
    coverImage: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop",
    cookingTime: 10,
    cookingMethod: "凉拌",
    tags: ["凉菜", "清爽"],
    mainIngredients: [
      { name: "黄瓜", amount: "2根" },
    ],
    seasonings: [
      { name: "蒜", amount: "3瓣" },
      { name: "醋", amount: "2勺" },
      { name: "盐", amount: "适量" },
      { name: "香油", amount: "少许" },
    ],
  },
  {
    id: "14",
    title: "地三鲜",
    coverImage: "https://images.unsplash.com/photo-1601311830595-4f8e2b4a8a62?w=400&h=300&fit=crop",
    cookingTime: 25,
    cookingMethod: "炒",
    tags: ["素菜", "东北菜"],
    mainIngredients: [
      { name: "土豆", amount: "1个" },
      { name: "茄子", amount: "1个" },
      { name: "青椒", amount: "2个" },
    ],
    seasonings: [
      { name: "盐", amount: "适量" },
      { name: "生抽", amount: "1勺" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "15",
    title: "干煸四季豆",
    coverImage: "https://images.unsplash.com/photo-1557844352-761f2565b576?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "炒",
    tags: ["川菜", "下饭"],
    mainIngredients: [
      { name: "四季豆", amount: "300g" },
      { name: "肉末", amount: "100g" },
    ],
    seasonings: [
      { name: "干辣椒", amount: "5个" },
      { name: "花椒", amount: "适量" },
      { name: "盐", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "16",
    title: "红烧茄子",
    coverImage: "https://images.unsplash.com/photo-1536304929831-ee1b51bd5bec?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "煮",
    tags: ["家常菜", "下饭"],
    mainIngredients: [
      { name: "茄子", amount: "2个" },
      { name: "肉末", amount: "100g" },
    ],
    seasonings: [
      { name: "豆瓣酱", amount: "1勺" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "17",
    title: "糖醋里脊",
    coverImage: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop",
    cookingTime: 30,
    cookingMethod: "炸",
    tags: ["鲁菜", "酸甜"],
    mainIngredients: [
      { name: "里脊肉", amount: "300g" },
    ],
    seasonings: [
      { name: "番茄酱", amount: "3勺" },
      { name: "糖", amount: "2勺" },
      { name: "醋", amount: "2勺" },
      { name: "淀粉", amount: "适量" },
      { name: "鸡蛋", amount: "1个" },
    ],
  },
  {
    id: "18",
    title: "鱼香肉丝",
    coverImage: "https://images.unsplash.com/photo-1592303637753-ce1e5b5c42c2?w=400&h=300&fit=crop",
    cookingTime: 25,
    cookingMethod: "炒",
    tags: ["川菜", "下饭"],
    mainIngredients: [
      { name: "猪肉", amount: "200g" },
      { name: "木耳", amount: "50g" },
      { name: "胡萝卜", amount: "1根" },
      { name: "青椒", amount: "1个" },
    ],
    seasonings: [
      { name: "豆瓣酱", amount: "1勺" },
      { name: "醋", amount: "1勺" },
      { name: "糖", amount: "1勺" },
    ],
  },
  {
    id: "19",
    title: "水煮牛肉",
    coverImage: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=300&fit=crop",
    cookingTime: 30,
    cookingMethod: "煮",
    tags: ["川菜", "辣"],
    mainIngredients: [
      { name: "牛肉", amount: "300g" },
      { name: "豆芽", amount: "200g" },
    ],
    seasonings: [
      { name: "干辣椒", amount: "10个" },
      { name: "花椒", amount: "适量" },
      { name: "豆瓣酱", amount: "2勺" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "20",
    title: "蒜蓉西兰花",
    coverImage: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop",
    cookingTime: 10,
    cookingMethod: "炒",
    tags: ["素菜", "健康"],
    mainIngredients: [
      { name: "西兰花", amount: "1颗" },
    ],
    seasonings: [
      { name: "蒜", amount: "5瓣" },
      { name: "盐", amount: "适量" },
      { name: "油", amount: "适量" },
    ],
  },
]

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
    鸡蛋: ["蛋", "鸡蛋"],
    蛋: ["鸡蛋"],
    葱: ["大葱", "小葱"],
    大葱: ["葱"],
    小葱: ["葱"],
    土豆: ["马铃薯"],
    马铃薯: ["土豆"],
    豆腐: ["嫩豆腐", "老豆腐"],
    嫩豆腐: ["豆腐"],
    老豆腐: ["豆腐"],
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
// 计算单个菜谱的匹配度（仅基于主食材）
// ============================================

interface MatchResult {
  recipe: Recipe
  availableMainIngredients: string[]
  missingMainIngredients: string[]
  matchingScore: number
  isAllAvailable: boolean
}

function calculateMatch(recipe: Recipe, userIngredients: string[]): MatchResult {
  const availableMainIngredients: string[] = []
  const missingMainIngredients: string[] = []

  for (const mainIng of recipe.mainIngredients) {
    const found = userIngredients.some((userIng) =>
      ingredientMatches(userIng, mainIng.name)
    )

    if (found) {
      availableMainIngredients.push(mainIng.name)
    } else {
      missingMainIngredients.push(mainIng.name)
    }
  }

  // 匹配度 = 已匹配的主食材数 / 需主食材总数
  const matchingScore =
    recipe.mainIngredients.length > 0
      ? availableMainIngredients.length / recipe.mainIngredients.length
      : 0

  // 主食材100%匹配视为"食材已备齐"
  const isAllAvailable = missingMainIngredients.length === 0

  return {
    recipe,
    availableMainIngredients,
    missingMainIngredients,
    matchingScore,
    isAllAvailable,
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
    return a.recipe.cookingTime - b.recipe.cookingTime
  })
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

    // 无 API Key 时使用本地匹配算法
    if (!process.env.AI_API_KEY) {
      console.log("[Recommend API] 使用本地匹配算法")

      const matchResults = RECIPE_DATABASE.map((recipe) =>
        calculateMatch(recipe, ingredients)
      )
      const sortedResults = sortRecommendations(matchResults)
      const top10 = sortedResults.slice(0, 10)

      const recommendations: Recommendation[] = top10.map((r) => ({
        recipeId: r.recipe.id,
        title: r.recipe.title,
        coverImage: r.recipe.coverImage,
        cookingMethod: r.recipe.cookingMethod,
        matchingScore: Math.round(r.matchingScore * 100) / 100,
        availableMainIngredients: r.availableMainIngredients,
        missingMainIngredients: r.missingMainIngredients,
        isAllAvailable: r.isAllAvailable,
        seasonings: r.recipe.seasonings.map((s) => s.name),
        cookingTime: r.recipe.cookingTime,
      }))

      return NextResponse.json({
        success: true,
        data: {
          recommendations,
          totalCandidates: RECIPE_DATABASE.length,
        },
      })
    }

    // 有 API Key 时，使用 AI 辅助筛选
    const client = createOpenAIClient()
    const model = process.env.TEXT_MODEL_NAME || "qwen-plus"

    const ingredientList = ingredients.join("、")
    const prompt = `你是一个智能厨师。根据用户的现有食材「${ingredientList}」，推荐最多15个最合适的菜名。

要求：
1. 只推荐用户食材能够制作的菜谱
2. 优先推荐主食材匹配度高的菜谱
3. 只返回菜名，用逗号分隔，不要其他解释

例如输出格式：番茄炒蛋,蒜蓉青菜,蛋炒饭

请直接输出菜名列表：`

    console.log("[Recommend API] 调用 AI...")

    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    })

    const aiResponse = response.choices?.[0]?.message?.content || ""
    console.log("[Recommend API] AI 返回:", aiResponse)

    // 解析 AI 返回的菜名
    const dishNames = aiResponse
      .split(/[,，、\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0 && name.length < 20)

    console.log("[Recommend API] 解析菜名:", dishNames)

    // 匹配菜谱
    const matchedRecipes = RECIPE_DATABASE.filter((recipe) =>
      dishNames.some(
        (dishName) =>
          recipe.title.includes(dishName) || dishName.includes(recipe.title)
      )
    )

    const recipesToRank = matchedRecipes.length > 0 ? matchedRecipes : RECIPE_DATABASE

    // 计算匹配度并排序
    const matchResults = recipesToRank.map((recipe) =>
      calculateMatch(recipe, ingredients)
    )
    const sortedResults = sortRecommendations(matchResults)
    const top10 = sortedResults.slice(0, 10)

    const recommendations: Recommendation[] = top10.map((r) => ({
      recipeId: r.recipe.id,
      title: r.recipe.title,
      coverImage: r.recipe.coverImage,
      cookingMethod: r.recipe.cookingMethod,
      matchingScore: Math.round(r.matchingScore * 100) / 100,
      availableMainIngredients: r.availableMainIngredients,
      missingMainIngredients: r.missingMainIngredients,
      isAllAvailable: r.isAllAvailable,
      seasonings: r.recipe.seasonings.map((s) => s.name),
      cookingTime: r.recipe.cookingTime,
    }))

    console.log("[Recommend API] 推荐结果:", recommendations.map((r) => `${r.title}(${r.matchingScore})`).join(", "))

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        totalCandidates: recipesToRank.length,
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
    recipeCount: RECIPE_DATABASE.length,
    mode: hasKey ? "ai-assisted" : "local-match",
  })
}
