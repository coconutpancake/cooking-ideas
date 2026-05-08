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
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("请求超时，请检查网络连接")), timeout)
  })

  const fetchPromise = fetch("/api/vision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image }),
  })

  let response: Response

  try {
    response = await Promise.race([fetchPromise, timeoutPromise])
  } catch (error) {
    throw new Error(`网络请求失败: ${error instanceof Error ? error.message : "未知错误"}`)
  }

  if (!response.ok) {
    throw new Error(`请求失败: HTTP ${response.status}`)
  }

  const data: IdentifyResponse = await response.json()

  if (!data.success) {
    throw new Error(data.error || "食材识别失败")
  }

  if (!data.data || data.data.ingredients.length === 0) {
    throw new Error("未能在图片中识别出食材，请上传包含清晰食材的图片")
  }

  return data
}