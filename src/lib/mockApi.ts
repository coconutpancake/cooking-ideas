/**
 * 图片识别 API
 * 调用后端 /api/vision 接口，失败时兜底使用 Mock 数据
 */

export interface IngredientItem {
  name: string
  amount?: string
}

export interface IdentifyResponse {
  success: boolean
  data: {
    ingredients: IngredientItem[]
    imageId: string
    message: string
  }
  error?: string
}

/**
 * 兜底 Mock 数据（API 不可用时使用）
 */
function getFallbackIngredients(): IngredientItem[] {
  const possibleIngredients = [
    "西红柿", "鸡蛋", "葱", "蒜", "姜", "青菜", "白菜",
    "土豆", "胡萝卜", "洋葱", "豆腐", "肉末", "辣椒",
    "盐", "油", "生抽", "老抽", "糖", "醋", "番茄酱",
  ]

  const count = Math.floor(Math.random() * 4) + 3
  const shuffled = [...possibleIngredients].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((name) => ({ name, amount: "适量" }))
}

/**
 * 图片识别 API
 * @param base64Image Base64 格式的图片
 * @param timeout 超时时间（毫秒），默认 30000
 */
export async function identifyIngredients(
  base64Image: string,
  timeout: number = 30000
): Promise<IdentifyResponse> {
  // 创建超时 Promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("请求超时，请重试")), timeout)
  })

  // 创建实际请求 Promise
  const fetchPromise = fetch("/api/vision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image }),
  })

  try {
    // 竞态：要么完成请求，要么超时
    const response = await Promise.race([fetchPromise, timeoutPromise])

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    const data: IdentifyResponse = await response.json()
    return data
  } catch (error) {
    console.error("[identifyIngredients] API 调用失败:", error)

    // 兜底策略：返回 Mock 数据
    return {
      success: true,
      data: {
        ingredients: getFallbackIngredients(),
        imageId: `fallback_${Date.now()}`,
        message: "网络不稳定，返回本地数据",
      },
    }
  }
}

/**
 * @deprecated 使用 identifyIngredients 代替
 */
export async function mockIdentifyIngredients(
  base64Image: string
): Promise<IdentifyResponse> {
  return identifyIngredients(base64Image)
}
