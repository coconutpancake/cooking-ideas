"use client"

import { useState, useEffect, useCallback } from "react"
import { getIngredients, addIngredient, removeIngredient, type StoredIngredient } from "@/lib/storage"

export interface UseIngredientsReturn {
  ingredients: StoredIngredient[]
  isLoading: boolean
  add: (name: string) => void
  remove: (id: string) => void
  refresh: () => void
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
  }, [refresh])

  const add = useCallback((name: string) => {
    addIngredient(name)
    refresh()
  }, [refresh])

  const remove = useCallback((id: string) => {
    removeIngredient(id)
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
