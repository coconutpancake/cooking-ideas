import { NextRequest } from "next/server"

import { jsonResponse, optionsResponse } from "@/lib/server/http"
import { createServerOpenAIClient } from "@/lib/server/openai"
import {
  handleApiError,
  parseJsonBody,
  requireApiAuth,
  validateRecommendationPayload,
} from "@/lib/server/security"

interface AIGeneratedRecipe {
  title: string
  emoji: string
  mainIngredients: string[]
  seasonings: string[]
  cookingMethod?: string
  cookingTime?: number
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

interface MatchResult {
  recipe: AIGeneratedRecipe
  availableMainIngredients: string[]
  missingMainIngredients: string[]
  matchingScore: number
  isAllAvailable: boolean
  cookingMethod: string
  cookingTime: number
}

const DEFAULT_TEXT_MODEL = "qwen-plus"
const DEFAULT_EMOJI = "🍽️"
const DEFAULT_COOKING_METHOD = "炒"
const DEFAULT_COOKING_TIME = 20

const INGREDIENT_ALIASES: Record<string, string[]> = {
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

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, "").trim()
}

function ingredientMatches(userIngredient: string, recipeIngredient: string): boolean {
  const userNorm = normalizeIngredientName(userIngredient)
  const recipeNorm = normalizeIngredientName(recipeIngredient)

  if (!userNorm || !recipeNorm) {
    return false
  }

  if (userNorm === recipeNorm) {
    return true
  }

  if (userNorm.includes(recipeNorm) || recipeNorm.includes(userNorm)) {
    return true
  }

  const userAliases = INGREDIENT_ALIASES[userNorm] || []
  const recipeAliases = INGREDIENT_ALIASES[recipeNorm] || []

  if (userAliases.includes(recipeNorm) || recipeAliases.includes(userNorm)) {
    return true
  }

  return false
}

function calculateMatch(recipe: AIGeneratedRecipe, userIngredients: string[]): MatchResult {
  const availableMainIngredients: string[] = []
  const missingMainIngredients: string[] = []

  for (const mainIngredient of recipe.mainIngredients) {
    const found = userIngredients.some((userIngredient) =>
      ingredientMatches(userIngredient, mainIngredient)
    )

    if (found) {
      availableMainIngredients.push(mainIngredient)
    } else {
      missingMainIngredients.push(mainIngredient)
    }
  }

  const matchingScore =
    recipe.mainIngredients.length > 0
      ? availableMainIngredients.length / recipe.mainIngredients.length
      : 0

  return {
    recipe,
    availableMainIngredients,
    missingMainIngredients,
    matchingScore,
    isAllAvailable: missingMainIngredients.length === 0,
    cookingMethod: recipe.cookingMethod || DEFAULT_COOKING_METHOD,
    cookingTime: recipe.cookingTime || DEFAULT_COOKING_TIME,
  }
}

function sortRecommendations(results: MatchResult[]): MatchResult[] {
  return results.sort((a, b) => {
    if (a.isAllAvailable !== b.isAllAvailable) {
      return a.isAllAvailable ? -1 : 1
    }

    if (Math.abs(a.matchingScore - b.matchingScore) > 0.01) {
      return b.matchingScore - a.matchingScore
    }

    if (a.missingMainIngredients.length !== b.missingMainIngredients.length) {
      return a.missingMainIngredients.length - b.missingMainIngredients.length
    }

    return a.cookingTime - b.cookingTime
  })
}

function splitList(value: string): string[] {
  return value
    .split(/[,\uFF0C\u3001/]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 1 && item.length <= 20)
}

function tryAddRecipe(
  item: unknown,
  results: AIGeneratedRecipe[],
  seenTitles: Set<string>
): void {
  if (!item || typeof item !== "object") {
    return
  }

  const obj = item as Record<string, unknown>
  const rawTitle = obj.title ?? obj.t
  const title = typeof rawTitle === "string" ? rawTitle.trim() : ""

  if (!title || title.length < 2 || title.length > 30 || seenTitles.has(title)) {
    return
  }

  const rawMainIngredients = obj.mainIngredients ?? obj.m ?? []
  const mainIngredients = Array.isArray(rawMainIngredients)
    ? rawMainIngredients
        .filter((ingredient): ingredient is string => typeof ingredient === "string")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length >= 1 && ingredient.length <= 20)
    : typeof rawMainIngredients === "string"
      ? splitList(rawMainIngredients)
      : []

  if (mainIngredients.length === 0) {
    return
  }

  const rawSeasonings = obj.seasonings ?? obj.s ?? []
  const seasonings = Array.isArray(rawSeasonings)
    ? rawSeasonings
        .filter((seasoning): seasoning is string => typeof seasoning === "string")
        .map((seasoning) => seasoning.trim())
        .filter((seasoning) => seasoning.length >= 1 && seasoning.length <= 20)
    : typeof rawSeasonings === "string"
      ? splitList(rawSeasonings)
      : []

  const rawCookingMethod = obj.cookingMethod ?? obj.c
  const cookingMethod =
    typeof rawCookingMethod === "string" && rawCookingMethod.trim()
      ? rawCookingMethod.trim()
      : DEFAULT_COOKING_METHOD

  const rawCookingTime = obj.cookingTime ?? obj.d
  const cookingTime =
    typeof rawCookingTime === "number" && Number.isFinite(rawCookingTime)
      ? Math.max(1, Math.round(rawCookingTime))
      : DEFAULT_COOKING_TIME

  const rawEmoji = obj.emoji ?? obj.e
  const emoji =
    typeof rawEmoji === "string" && rawEmoji.trim() && rawEmoji.trim().length <= 4
      ? rawEmoji.trim()
      : DEFAULT_EMOJI

  results.push({
    title,
    emoji,
    mainIngredients,
    seasonings,
    cookingMethod,
    cookingTime,
  })
  seenTitles.add(title)
}

function parseAIResponse(content: string): AIGeneratedRecipe[] {
  const results: AIGeneratedRecipe[] = []
  const seenTitles = new Set<string>()
  const cleaned = content.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()

  const collectRecipes = (items: unknown[]) => {
    for (const item of items) {
      tryAddRecipe(item, results, seenTitles)

      if (results.length >= 10) {
        break
      }
    }
  }

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      collectRecipes(parsed)
    } else {
      tryAddRecipe(parsed, results, seenTitles)
    }
  } catch {}

  if (results.length >= 10) {
    return results.slice(0, 10)
  }

  const arrayMatches = cleaned.match(/\[[\s\S]*?\]/g) || []
  for (const arrayString of arrayMatches) {
    try {
      const parsed = JSON.parse(arrayString)
      if (Array.isArray(parsed)) {
        collectRecipes(parsed)
      }
    } catch {}

    if (results.length >= 10) {
      return results.slice(0, 10)
    }
  }

  const objectMatches = cleaned.match(/\{[\s\S]*?\}/g) || []
  for (const objectString of objectMatches) {
    try {
      const parsed = JSON.parse(objectString)
      tryAddRecipe(parsed, results, seenTitles)
    } catch {}

    if (results.length >= 10) {
      return results.slice(0, 10)
    }
  }

  return results.slice(0, 10)
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

    const body = await parseJsonBody(request, "recommend")
    const ingredients = validateRecommendationPayload(body)

    if (!ingredients || ingredients.length === 0) {
      return jsonResponse(
        request,
        { success: false, error: "缺少食材列表" },
        { status: 400 }
      )
    }

    if (!process.env.AI_API_KEY) {
      return jsonResponse(
        request,
        { success: false, error: "未配置 AI_API_KEY，无法生成推荐" },
        { status: 500 }
      )
    }

    const client = createServerOpenAIClient()
    const model = process.env.TEXT_MODEL_NAME || DEFAULT_TEXT_MODEL
    const ingredientList = ingredients.join("、")

    const prompt =
      "你是一个顶级中餐厨师。请严格根据用户食材「" +
      ingredientList +
      "」，生成恰好10道菜谱推荐。\n\n【硬性约束 - 违反将被拒绝】：\n" +
      "1. 恰好10道菜，不多不少\n" +
      "2. 同一主食材（如：排骨、鸡蛋、番茄）最多出现2次\n" +
      "3. 必须包含：至少2道纯素菜、至少3道荤素搭配、至少1道蛋类菜\n" +
      "4. 必须覆盖不同烹饪方式：炒、煮、蒸、烤、炸、凉拌\n\n" +
      "【简化JSON格式 - 严格按此格式】：\n" +
      '[{"t":"菜名","e":"🍅🍳","m":["主食材1","主食材2"],"s":["调料1"],"c":"炒","d":15},...]\n\n' +
      "字段说明：t=菜名(必填), e=Emoji配图(必填，1-2个emoji), m=主食材数组(必填且>=1), s=调料数组(选填), c=烹饪方式(选填默认炒), d=时间分钟(选填默认15)\n\n" +
      "只输出JSON数组，不要任何其他文字。数组必须是完整的10个对象。"

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业中餐厨师。你必须严格返回恰好10道菜谱，主食材不能重复超过2次。输出必须是完整有效的JSON数组。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    })

    const aiResponse = response.choices?.[0]?.message?.content || ""
    const parsedRecipes = parseAIResponse(aiResponse)

    if (parsedRecipes.length === 0) {
      return jsonResponse(
        request,
        { success: false, error: "AI 返回格式解析失败，请重试" },
        { status: 500 }
      )
    }

    const matchResults = parsedRecipes.map((recipe) => calculateMatch(recipe, ingredients))
    const filteredResults = matchResults.filter((result) => result.matchingScore > 0)

    if (filteredResults.length === 0) {
      return jsonResponse(
        request,
        { success: false, error: "没有找到匹配的菜谱，请尝试添加其他食材" },
        { status: 404 }
      )
    }

    const recommendations: Recommendation[] = sortRecommendations(filteredResults)
      .slice(0, 10)
      .map((result, index) => ({
        recipeId: `ai-${Date.now()}-${index}`,
        title: result.recipe.title,
        emoji: result.recipe.emoji || DEFAULT_EMOJI,
        cookingMethod: result.cookingMethod,
        matchingScore: Math.round(result.matchingScore * 100) / 100,
        availableMainIngredients: result.availableMainIngredients,
        missingMainIngredients: result.missingMainIngredients,
        isAllAvailable: result.isAllAvailable,
        seasonings: result.recipe.seasonings,
        cookingTime: result.cookingTime,
      }))

    return jsonResponse(request, {
      success: true,
      data: {
        recommendations,
        totalCandidates: filteredResults.length,
      },
    })
  } catch (error) {
    return handleApiError(request, error)
  }
}

export async function GET(request: NextRequest) {
  const hasKey = Boolean(process.env.AI_API_KEY)

  return jsonResponse(request, {
    status: "ok",
    mode: hasKey ? "ai-json" : "no-api-key",
    description: hasKey ? "AI 生成多样化菜谱推荐（JSON 格式）" : "需要配置 AI_API_KEY",
  })
}
