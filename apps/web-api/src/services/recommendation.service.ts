import "server-only"

import { createServerOpenAIClient } from "@/lib/server/openai"
import { ApiRequestError, type RecommendationPayload } from "@/lib/server/security"

import { DEFAULT_TEXT_MODEL } from "./ai.constants"
import { parseRecommendationResponse } from "./recommendation-parser"
import { buildTasteInstruction, formatMealPreference } from "./recommendation-prompts"
import {
  DEFAULT_EMOJI,
  calculateMatch,
  normalizeMainIngredientsForContext,
  sortPersonalizedRecommendations,
} from "./recommendation-normalization"
import type { Recommendation } from "./recommendation-types"

export async function generateRecipeRecommendations(context: RecommendationPayload): Promise<{
  recommendations: Recommendation[]
  totalCandidates: number
}> {
  const client = createServerOpenAIClient()
  const model = process.env.TEXT_MODEL_NAME || DEFAULT_TEXT_MODEL
  const { ingredients, pinnedIngredients, mealPreference, userPreferences, excludeRecipeTitles, pageSize } = context
  const ingredientList = ingredients.join("、")
  const pinnedList = pinnedIngredients.length > 0 ? pinnedIngredients.join("、") : "无"
  const mealPreferenceText = formatMealPreference(mealPreference)
  const tasteInstruction = buildTasteInstruction(userPreferences, pageSize)
  const preferenceText = userPreferences
    ? `长期目标：${userPreferences.goal || "无"}；偏爱口味：${userPreferences.tastes.join("、") || "无"}；忌口：${userPreferences.avoidances.join("、") || "无"}`
    : "无长期偏好"
  const excludedText = excludeRecipeTitles.length > 0 ? excludeRecipeTitles.join("、") : "无"

  const prompt =
    "你是一个顶级中餐厨师。请严格根据用户食材「" +
    ingredientList +
    `」，生成恰好${pageSize}道菜谱推荐。\n\n` +
    "【用户上下文】：\n" +
    `1. 标星必吃食材：${pinnedList}\n` +
    `2. 本餐偏好：${mealPreferenceText}\n` +
    `3. 长期偏好：${preferenceText}\n` +
    `4. 口味执行要求：${tasteInstruction}\n` +
    `5. 已展示菜名，必须避开：${excludedText}\n\n` +
    "【多元生成策略】：\n" +
    "策略A：包含标星食材 + 符合本餐偏好 + 贴合长期偏好，约40%。\n" +
    "策略B：包含标星食材 + 符合本餐偏好，可适度忽略长期偏好，约30%。\n" +
    "策略C：仅依赖现有主食材跨菜系发散，约30%。\n\n" +
    "【硬性约束 - 违反将被拒绝】：\n" +
    `1. 恰好${pageSize}道菜，不多不少\n` +
    "2. 若存在标星食材，策略A和策略B菜谱必须包含至少一个标星食材\n" +
    "3. 同一主食材（如：排骨、鸡蛋、番茄）最多出现2次；但标星食材是用户本次明确想吃的食材，可以超过2次\n" +
    "4. 必须覆盖不同烹饪方式：炒、煮、蒸、烤、凉拌\n" +
    "5. 避开用户忌口，不要生成已展示菜名\n" +
    "6. 不要把同一肉类大类直接当作具体部位：用户有猪肉不等于有排骨/猪蹄/猪肝，用户有牛肉不等于有牛腩/牛腱/牛排，用户有鸡肉不等于有鸡翅/鸡爪。只有肉丝、肉片、肉末、里脊、五花肉等常规切配形态可与通用肉类互相视为可替代。\n\n" +
    "7. 菜名里出现的所有主食材必须出现在 m 数组里。例如“猪肉洋葱炒丝瓜”的 m 必须包含“猪肉”“洋葱”“丝瓜”。不要在菜名里写一个食材、却不在 m 数组中声明。\n\n" +
    "8. 菜名要像真实家常菜名：优先使用通用名称或有食欲的短名称，例如“地三鲜”“鱼香肉丝”“黄瓜炒蛋”。不要机械堆叠所有食材，不要写成“玉米粒西兰花快炒肉片”这种冗长名字。菜名建议 4-8 个汉字，最多 10 个汉字。\n" +
    "9. 主食材 m 只能放决定这道菜主体的食材，如肉、蛋、豆制品、蔬菜、主食。调料/辅料 s 放油、盐、糖、醋、生抽、老抽、料酒、蚝油、淀粉、胡椒粉、辣椒粉、豆瓣酱、番茄酱、黄豆酱、甜面酱、葱姜蒜、清水/高汤等。番茄酱不是番茄，不能放入 m，也不能按“半个”估量。\n\n" +
    "【简化JSON格式 - 严格按此格式】：\n" +
    '[{"t":"菜名","e":"🍅🍳","m":["主食材1","主食材2"],"s":["调料1"],"c":"炒","d":15,"strategy":"A"},...]\n\n' +
    "字段说明：t=菜名(必填), e=Emoji配图(必填，1-2个emoji), m=主食材数组(必填且>=1), s=调料数组(选填), c=烹饪方式(选填默认炒), d=时间分钟(选填默认15), strategy=A/B/C(必填)\n\n" +
    `只输出JSON数组，不要任何其他文字。数组必须是完整的${pageSize}个对象。`

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "你是一个专业中餐厨师。你必须严格返回指定数量的菜谱，主食材不能重复超过2次。输出必须是完整有效的JSON数组。",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 4000,
  })

  const aiResponse = response.choices?.[0]?.message?.content || ""
  const parsedRecipes = parseRecommendationResponse(aiResponse, pageSize)

  if (parsedRecipes.length === 0) {
    throw new Error("Failed to parse AI recommendation response")
  }

  const excludedTitleSet = new Set(excludeRecipeTitles.map((title) => title.toLowerCase()))
  const matchResults = parsedRecipes
    .filter((recipe) => !excludedTitleSet.has(recipe.title.toLowerCase()))
    .map((recipe) => normalizeMainIngredientsForContext(recipe, ingredients))
    .map((recipe) => calculateMatch(recipe, ingredients, pinnedIngredients))
  const filteredResults = matchResults.filter((result) => result.matchingScore >= 0.4)

  if (filteredResults.length === 0) {
    throw new ApiRequestError("没有找到匹配的菜谱，请尝试添加其他食材", 404)
  }

  const recommendationIdPrefix = Date.now()
  const sortedResults = sortPersonalizedRecommendations(filteredResults)
  const recommendations: Recommendation[] = sortedResults
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
    totalCandidates: filteredResults.length,
  }
}
