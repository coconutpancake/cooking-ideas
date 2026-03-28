/**
 * Mock 后端 API
 * 模拟图片识别食材的响应
 */

export interface MockIdentifyResponse {
  success: boolean
  data: {
    ingredients: string[]
    imageId: string
    message: string
  }
}

/**
 * 模拟图片识别 API
 * 假装识别图片中的食材
 * @param _base64Image Base64 格式的图片（实际不处理）
 */
export async function mockIdentifyIngredients(
  _base64Image: string
): Promise<MockIdentifyResponse> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // 模拟随机返回一些常见食材
  const possibleIngredients = [
    "西红柿", "鸡蛋", "葱", "蒜", "姜", "青菜", "白菜",
    "土豆", "胡萝卜", "洋葱", "豆腐", "肉末", "辣椒",
    "盐", "油", "生抽", "老抽", "糖", "醋", "番茄酱",
  ]

  // 随机选择 3-6 种食材
  const count = Math.floor(Math.random() * 4) + 3
  const shuffled = [...possibleIngredients].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)

  return {
    success: true,
    data: {
      ingredients: selected,
      imageId: `img_${Date.now()}`,
      message: `成功识别出 ${selected.length} 种食材`,
    },
  }
}
