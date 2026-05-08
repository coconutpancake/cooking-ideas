/**
 * 菜谱数据结构（供其他模块引用）
 * 注意：具体菜谱数据已迁移至 /api/recommend，由 AI 动态生成
 */

export interface Ingredient {
  name: string
  amount?: string
}

export interface Recipe {
  id: string
  title: string
  emoji?: string
  cookingTime: number
  cookingMethod: "炒" | "煮" | "蒸" | "烤" | "炸" | "凉拌" | "其他"
  tags: string[]
  mainIngredients: Ingredient[]
  seasonings: Ingredient[]
  steps?: { order: number; description: string }[]
  tips?: string
}

// 本地菜谱数据已移除，推荐列表完全由 /api/recommend AI 动态生成