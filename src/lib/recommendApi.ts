/**
 * 菜谱推荐 API
 */

export interface Recommendation {
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

export interface RecommendResponse {
  success: boolean
  data?: {
    recommendations: Recommendation[]
    totalCandidates: number
  }
  error?: string
}

/**
 * 获取菜谱推荐
 * @param ingredients 用户现有食材列表
 */
export async function getRecommendations(
  ingredients: string[]
): Promise<RecommendResponse> {
  const timeout = 30000

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("请求超时，请检查网络连接"))
    }, timeout)
  })

  const fetchPromise = fetch("/api/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ingredients }),
  })

  let response: Response

  try {
    response = await Promise.race([fetchPromise, timeoutPromise])
  } catch (error) {
    console.error("[getRecommendations] 请求失败:", error)
    throw new Error("网络请求失败")
  }

  if (!response.ok) {
    throw new Error("请求失败: HTTP " + response.status)
  }

  const data: RecommendResponse = await response.json()

  if (!data.success) {
    throw new Error(data.error || "获取推荐失败")
  }

  console.log("[getRecommendations] 获取成功:", data.data?.recommendations.length, "条推荐")
  return data
}
