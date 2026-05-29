import "server-only"

import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions"

import { createServerOpenAIClient } from "@/lib/server/openai"
import { ApiRequestError, type RecommendationPayload } from "@/lib/server/security"

import { DEFAULT_TEXT_MODEL } from "./ai.constants"
import { parseRecommendationResponse } from "./recommendation-parser"
import {
  buildMealPreferenceInstruction,
  buildTasteInstruction,
  formatMealPreference,
} from "./recommendation-prompts"
import {
  DEFAULT_EMOJI,
  calculateMatch,
  normalizeMainIngredientsForContext,
  removeSimilarRecommendations,
  sortPersonalizedRecommendations,
} from "./recommendation-normalization"
import type { Recommendation } from "./recommendation-types"

const MIN_MATCHING_SCORE = 0.4

type MiMoCompletionParams = ChatCompletionCreateParamsNonStreaming & {
  extra_body?: {
    thinking: {
      type: "disabled"
    }
  }
}

function formatList(items: string[], fallback = "无"): string {
  return items.length > 0 ? items.join("、") : fallback
}

export async function generateRecipeRecommendations(context: RecommendationPayload): Promise<{
  recommendations: Recommendation[]
  totalCandidates: number
}> {
  const client = createServerOpenAIClient()
  const model = process.env.TEXT_MODEL_NAME || DEFAULT_TEXT_MODEL
  const { ingredients, pinnedIngredients, mealPreference, userPreferences, excludeRecipeTitles, pageSize } = context
  const ingredientList = formatList(ingredients)
  const pinnedList = formatList(pinnedIngredients)
  const mealPreferenceText = formatMealPreference(mealPreference)
  const mealPreferenceInstruction = buildMealPreferenceInstruction(mealPreference)
  const tasteInstruction = buildTasteInstruction(userPreferences, pageSize)
  const preferenceText = userPreferences
    ? `目标=${userPreferences.goal || "无"}；口味=${formatList(userPreferences.tastes)}；忌口=${formatList(userPreferences.avoidances)}`
    : "无长期偏好"
  const excludedText = formatList(excludeRecipeTitles)
  const candidateCount = Math.min(18, Math.max(pageSize + 4, Math.ceil(pageSize * 1.4)))
  const maxTokens = Math.min(2800, Math.max(900, candidateCount * 170 + 450))

  const prompt =
    `根据食材「${ingredientList}」生成${candidateCount}道真实家常菜候选，接口会筛选后展示${pageSize}道。\n` +
    `标星=${pinnedList}；本餐偏好=${mealPreferenceText}；长期偏好=${preferenceText}；已展示禁用=${excludedText}。\n` +
    `本餐偏好要求：${mealPreferenceInstruction}\n` +
    `口味要求：${tasteInstruction}\n` +
    "策略：A=标星+本餐+长期约40%，B=标星+本餐约30%，C=现有食材发散约30%。有标星时 A/B 必含至少一个标星食材。\n" +
    "规则：同一非标星主食材最多出现2次；覆盖炒/煮/蒸/烤/凉拌等不同做法；避开忌口和已展示菜名；通用肉类不要当具体部位，如猪肉不等于排骨/猪蹄。\n" +
    "不要把所有食材强行两两拼成组合菜；适合单独成菜的核心食材也应保留经典家常单品菜。不要只调整食材顺序或把烧/炖/焖等近似做法互换来生成雷同菜。\n" +
    "菜名要短且真实，优先 4-8 个汉字，最多10个。菜名出现的所有主食材必须在 m 中。m 只放菜品主体食材；油盐糖醋、生抽老抽、料酒蚝油、淀粉、胡椒粉、辣椒粉、酱料、葱姜蒜、水/高汤等放 s。番茄酱不是番茄。\n" +
    '只输出紧凑 JSON 对象：{"recipes":[{"t":"菜名","e":"🍅🍳","m":["主食材"],"s":["调料"],"c":"炒","d":15,"strategy":"A"}]}。不要解释。'

  const buildMessages = (userPrompt: string) =>
    [
      {
        role: "system" as const,
        content:
          "你是一个专业中餐厨师。你必须严格返回指定数量的菜谱，主食材不能重复超过2次。输出必须是完整有效的JSON对象。",
      },
      { role: "user" as const, content: userPrompt },
    ]

  const requestRecipes = async (userPrompt: string, temperature: number) => {
    const completionParams: MiMoCompletionParams = {
      model,
      messages: buildMessages(userPrompt),
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      extra_body: { thinking: { type: "disabled" } },
    }
    const response = await client.chat.completions.create(completionParams)

    return response.choices?.[0]?.message?.content || ""
  }

  let aiResponse = await requestRecipes(prompt, 0.8)
  let parsedRecipes = parseRecommendationResponse(aiResponse, candidateCount)

  if (parsedRecipes.length === 0) {
    const retryPrompt =
      prompt +
      '\n\n上一次输出无法解析。这一次只返回严格 JSON 对象，格式必须是 {"recipes":[...]}，不要 Markdown，不要解释，不要多余文字。'
    aiResponse = await requestRecipes(retryPrompt, 0.3)
    parsedRecipes = parseRecommendationResponse(aiResponse, candidateCount)
  }

  if (parsedRecipes.length === 0) {
    throw new Error("Failed to parse AI recommendation response")
  }

  const excludedTitleSet = new Set(excludeRecipeTitles.map((title) => title.toLowerCase()))
  const matchResults = parsedRecipes
    .filter((recipe) => !excludedTitleSet.has(recipe.title.toLowerCase()))
    .map((recipe) => normalizeMainIngredientsForContext(recipe, ingredients))
    .map((recipe) => calculateMatch(recipe, ingredients, pinnedIngredients))
  const filteredResults = matchResults.filter((result) => result.matchingScore >= MIN_MATCHING_SCORE)
  const candidateResults = filteredResults.length > 0 ? filteredResults : matchResults

  if (candidateResults.length === 0) {
    throw new ApiRequestError("没有找到匹配的菜谱，请尝试添加其他食材", 404)
  }

  const recommendationIdPrefix = Date.now()
  const sortedResults = sortPersonalizedRecommendations(candidateResults, {
    mealPreference,
    userPreferences,
  })
  const uniqueResults = removeSimilarRecommendations(sortedResults, excludeRecipeTitles)
  const recommendations: Recommendation[] = uniqueResults
    .slice(0, pageSize)
    .map((result, index) => ({
      recipeId: `ai-${recommendationIdPrefix}-${index}`,
      title: result.recipe.title,
      emoji: result.recipe.emoji || DEFAULT_EMOJI,
      cookingMethod: result.cookingMethod,
      matchingScore: Math.round(result.matchingScore * 100) / 100,
      availableMainIngredients: result.availableMainIngredients,
      missingMainIngredients: result.missingMainIngredients,
      isAllAvailable: result.isAllAvailable,
      seasonings: result.recipe.seasonings,
      cookingTime: result.cookingTime,
      strategy: result.recipe.strategy,
    }))

  return {
    recommendations,
    totalCandidates: uniqueResults.length,
  }
}
