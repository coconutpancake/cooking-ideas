/**
 * 图片识别 API
 * 调用后端 /api/vision 接口
 */

export interface IngredientItem {
  name: string
  amount?: string
}

export interface IdentifyResponse {
  success: boolean
  data?: {
    ingredients: IngredientItem[]
    imageId: string
    message: string
  }
  error?: string
  isMock?: boolean
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
    setTimeout(() => reject(new Error("请求超时，请检查网络连接")), timeout)
  })

  // 创建实际请求 Promise
  const fetchPromise = fetch("/api/vision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image }),
  })

  let response: Response

  try {
    // 竞态：要么完成请求，要么超时
    response = await Promise.race([fetchPromise, timeoutPromise])
  } catch (error) {
    console.error("[identifyIngredients] ❌ 请求失败:", error)
    throw new Error(`网络请求失败: ${error instanceof Error ? error.message : "未知错误"}`)
  }

  if (!response.ok) {
    const errorText = `HTTP ${response.status}: ${response.statusText}`
    console.error("[identifyIngredients] ❌ HTTP 错误:", errorText)
    throw new Error(`请求失败: ${errorText}`)
  }

  const data: IdentifyResponse = await response.json()

  // 检查后端返回的错误
  if (!data.success) {
    console.error("[identifyIngredients] ❌ 识别失败:", data.error)
    throw new Error(data.error || "食材识别失败")
  }

  // 检查是否为空结果
  if (!data.data || data.data.ingredients.length === 0) {
    console.warn("[identifyIngredients] ⚠️ 未识别出任何食材")
    throw new Error("未能在图片中识别出食材，请上传包含清晰食材的图片")
  }

  console.log("[identifyIngredients] ✅ 识别成功:", data.data.ingredients)
  return data
}

/**
 * @deprecated 使用 identifyIngredients 代替
 */
export async function mockIdentifyIngredients(
  base64Image: string
): Promise<IdentifyResponse> {
  return identifyIngredients(base64Image)
}
