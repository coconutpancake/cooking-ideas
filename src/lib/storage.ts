/**
 * LocalStorage 工具
 */

const INGREDIENTS_KEY = "cooking_ideas_ingredients"
const LAST_UPDATED_KEY = "cooking_ideas_last_updated"

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
  // 同步更新时间戳
  setLastUpdated(Date.now())
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
 * 批量添加食材（不去重，合并后统一保存）
 */
export function addIngredients(names: string[]): StoredIngredient[] {
  const existing = getIngredients()
  const existingNames = new Set(existing.map(i => i.name))
  const added: StoredIngredient[] = []

  names.forEach(name => {
    const trimmed = name.trim()
    if (trimmed && !existingNames.has(trimmed)) {
      existingNames.add(trimmed)
      added.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: trimmed,
        addedAt: Date.now(),
      })
    }
  })

  if (added.length > 0) {
    saveIngredients([...existing, ...added])
  }
  return added
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
  localStorage.removeItem(LAST_UPDATED_KEY)
}

/**
 * 获取上次更新时间戳
 */
export function getLastUpdated(): number | null {
  if (typeof window === "undefined") return null
  const ts = localStorage.getItem(LAST_UPDATED_KEY)
  return ts ? parseInt(ts, 10) : null
}

/**
 * 设置上次更新时间戳
 */
export function setLastUpdated(ts: number): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LAST_UPDATED_KEY, String(ts))
}