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

export function buildTasteInstruction(
  userPreferences: RecommendationPayload["userPreferences"],
  pageSize: number
): string {
  const tastes = userPreferences?.tastes || []
  const instructions: string[] = []
  const activeTasteCount = tastes.length
  const perTasteHint = activeTasteCount > 1
    ? `用户选择了多个偏爱口味时，要在推荐列表里尽量覆盖这些偏好，也可以做合理组合：既可以分别生成偏辣菜、西餐菜，也可以在真实做饭逻辑成立时生成辣味西餐或其他组合。不要为了组合偏好牺牲食材匹配、真实菜名和正常做法。可按每种偏好约 ${Math.max(1, Math.floor(pageSize * 0.4 / activeTasteCount))} 道来体现。`
    : ""

  if (tastes.includes("无辣不欢")) {
    instructions.push("用户偏爱“无辣不欢”：在不违背忌口的前提下，至少生成3道带有辣味表达的菜（如香辣、麻辣、青椒、辣椒、豆瓣酱），但不要让全部菜都变辣。")
  }

  if (tastes.includes("清淡养生")) {
    instructions.push("用户偏爱“清淡养生”：优先蒸、煮、焯拌、少油快炒，减少重油重辣。")
  }

  if (tastes.includes("清淡鲜美")) {
    instructions.push("用户偏爱“清淡鲜美”：优先突出食材本味、鲜味和少油调味，可使用清炒、蒸、煮、焯拌等做法。")
  }

  if (tastes.includes("重口下饭") || tastes.includes("经典下饭")) {
    instructions.push("用户偏爱“经典下饭/重口下饭”：可适当使用酱香、红烧、干煸、香辣、葱爆等更适合配米饭的做法。")
  }

  if (tastes.includes("酸甜开胃")) {
    instructions.push("用户偏爱“酸甜开胃”：可优先使用番茄、醋、糖醋汁、柠檬等合理酸甜元素，但不要把调料误当主食材。")
  }

  if (tastes.includes("咸甜交织")) {
    instructions.push("用户偏爱“咸甜交织”：可使用照烧、蜜汁、酱烧、糖醋等咸甜平衡的风味，但菜名和做法要自然。")
  }

  if (tastes.includes("中式小炒")) {
    instructions.push("用户偏爱“中式小炒”：优先生成真实家常小炒，如黄瓜炒肉片、青椒肉丝、洋葱炒蛋、蒜蓉西兰花等；菜名必须完整自然，不要写成“猪肉黄瓜炒”这类半截菜名。")
  }

  if (tastes.includes("偏爱西餐") || tastes.includes("轻食西餐")) {
    instructions.push("用户偏爱“轻食西餐/偏爱西餐”：如果现有食材中包含意大利面、通心粉、芝士、黄油、牛奶、奶油、番茄酱等西餐核心食材，至少生成1道明确使用这些食材的轻食西式菜；不要在没有核心食材时强行西餐化。")
  }

  if (tastes.includes("乐于尝试")) {
    instructions.push("用户偏爱“乐于尝试”：可以给出1-2道融合或新鲜搭配，但仍必须符合真实做饭逻辑和食材匹配。")
  }

  if (instructions.length > 0) {
    return [perTasteHint, ...instructions].filter(Boolean).join(" ")
  }

  return "按用户长期口味偏好调整风味，但不要牺牲食材匹配度。"
}

