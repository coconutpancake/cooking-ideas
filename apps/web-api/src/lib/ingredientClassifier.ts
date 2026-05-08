// ─── 食材分类 ───────────────────────────────────────────────
export type CategoryKey = "meat" | "vegetable" | "other"

export interface CategoryConfig {
  key: CategoryKey
  label: string
}

export const CATEGORIES: CategoryConfig[] = [
  { key: "meat", label: "肉类海鲜" },
  { key: "vegetable", label: "蔬菜水果" },
  { key: "other", label: "调料其他" },
]

// 食材分类映射
export function classifyIngredient(name: string): CategoryKey {
  const n = name.toLowerCase()
  if (/猪|牛|羊|鸡|鸭|鹅|肉|鱼|虾|蟹|贝|蛤|螺|鱿鱼|章鱼|牛排|香肠|腊肉|火腿|培根|排骨|蹄|内脏|肝|腰|肚/.test(n)) return "meat"
  if (/菜|蔬|番茄|西红柿|黄瓜|土豆|马铃薯|萝卜|胡萝卜|洋葱|葱|蒜|姜|椒|茄子|豆角|四季豆|西兰花|菠菜|白菜|生菜|油菜|芹菜|韭菜|香菜|茼蒿|苦瓜|丝瓜|冬瓜|南瓜|莲藕|竹笋|菌|菇|木耳|豆腐|豆浆|腐竹|水果|苹果|香蕉|梨|桃|橙|橘|葡萄|草莓|蓝莓|芒果|西瓜|菠萝|柠檬/.test(n)) return "vegetable"
  return "other"
}