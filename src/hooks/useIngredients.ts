"use client"

import { useState, useEffect, useCallback } from "react"
import { getIngredients, addIngredient, removeIngredient, type StoredIngredient } from "@/lib/storage"

const INGREDIENTS_CHANGED_EVENT = "cooking_ideas_ingredients_changed"

export interface UseIngredientsReturn {
  ingredients: StoredIngredient[]
  isLoading: boolean
  add: (name: string) => void
  remove: (id: string) => void
  refresh: () => void
}

/** 通知所有 useIngredients 实例刷新（用于跨组件状态同步） */
export function notifyIngredientsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INGREDIENTS_CHANGED_EVENT))
  }
}

export function useIngredients(): UseIngredientsReturn {
  const [ingredients, setIngredients] = useState<StoredIngredient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(() => {
    const data = getIngredients()
    setIngredients(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refresh()

    // 监听其他组件触发的刷新事件（跨组件状态同步）
    const handleChanged = () => refresh()
    window.addEventListener(INGREDIENTS_CHANGED_EVENT, handleChanged)
    return () => window.removeEventListener(INGREDIENTS_CHANGED_EVENT, handleChanged)
  }, [refresh])

  const add = useCallback((name: string) => {
    addIngredient(name)
    notifyIngredientsChanged()
    refresh()
  }, [refresh])

  const remove = useCallback((id: string) => {
    removeIngredient(id)
    notifyIngredientsChanged()
    refresh()
  }, [refresh])

  return {
    ingredients,
    isLoading,
    add,
    remove,
    refresh,
  }
}
