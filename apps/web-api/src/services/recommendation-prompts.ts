import "server-only"

import type { RecommendationPayload } from "@/lib/server/security"

export function formatMealPreference(value: string | null): string {
  const labels: Record<string, string> = {
    speed: "极速快手",
    comfort: "下饭解馋",
    light: "清淡养生",
    protein: "高蛋白",
    lessOil: "少油少盐",
  }

  return value ? labels[value] || value : "无"
}

export function buildMealPreferenceInstruction(value: string | null): string {
  const preference = formatMealPreference(value)

  if (!value) {
    return "无本餐偏好时，保持食材匹配和家常真实感优先。"
  }

  return `用户本餐偏好原文为“${preference}”。请深度理解用户的【本餐偏好】所传达的饮食诉求与情绪。例如，如果包含下饭等诉求，请确保菜品在口味层次或汤汁上更适合搭配主食，但绝对不要局限于特定的烹饪手法（如必须红烧或爆炒），请结合用户现有的食材自由且合理地发挥。`
}

export function buildTasteInstruction(
  userPreferences: RecommendationPayload["userPreferences"],
  pageSize: number
): string {
  const tastes = userPreferences?.tastes || []
  const activeTasteCount = tastes.length

  if (activeTasteCount > 0) {
    const coverageHint = activeTasteCount > 1
      ? `推荐列表要尽量覆盖这些偏好，也可以在真实做饭逻辑成立时自然组合；不要为了覆盖偏好牺牲食材匹配、真实菜名和正常做法。可参考每种偏好约 ${Math.max(1, Math.floor(pageSize * 0.4 / activeTasteCount))} 道来体现，但不要机械平均。`
      : "推荐列表中应有一部分菜品自然体现这个长期偏好，但不要牺牲食材匹配、真实菜名和正常做法。"

    return `用户长期口味偏好原文为“${tastes.join("、")}”。请直接理解这些标签或自定义表达背后的饮食诉求与情绪，不要把它们映射成固定菜式或固定烹饪手法。${coverageHint}`
  }

  return "按用户长期口味偏好调整风味，但不要牺牲食材匹配度。"
}

