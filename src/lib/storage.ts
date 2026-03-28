/**
 * LocalStorage 工具
 */

const INGREDIENTS_KEY = "cooking_ideas_ingredients"

export interface StoredIngredient {
  id: string
  name: string
  addedAt: number
}

/**
 * 获取所有食材
 */
export function getIngredients(): StoredIngredient[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(INGREDIENTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * 保存食材列表
 */
export function saveIngredients(ingredients: StoredIngredient[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients))
}

/**
 * 添加食材（去重）
 * @returns 新食材，或 null（如果已存在）
 */
export function addIngredient(name: string): StoredIngredient | null {
  const ingredients = getIngredients()
  const trimmedName = name.trim()

  // 检查是否已存在同名食材
  if (ingredients.some((i) => i.name === trimmedName)) {
    return null
  }

  const newIngredient: StoredIngredient = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: trimmedName,
    addedAt: Date.now(),
  }
  ingredients.push(newIngredient)
  saveIngredients(ingredients)
  return newIngredient
}

/**
 * 删除食材
 */
export function removeIngredient(id: string): void {
  const ingredients = getIngredients()
  const filtered = ingredients.filter((i) => i.id !== id)
  saveIngredients(filtered)
}

/**
 * 清空所有食材
 */
export function clearIngredients(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(INGREDIENTS_KEY)
}
