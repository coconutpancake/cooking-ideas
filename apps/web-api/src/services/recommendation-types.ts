export interface AIGeneratedRecipe {
  title: string
  emoji: string
  mainIngredients: string[]
  seasonings: string[]
  cookingMethod?: string
  cookingTime?: number
  strategy?: "A" | "B" | "C"
}

export interface Recommendation {
  recipeId: string
  title: string
  emoji: string
  cookingMethod: string
  matchingScore: number
  availableMainIngredients: string[]
  missingMainIngredients: string[]
  isAllAvailable: boolean
  seasonings: string[]
  cookingTime: number
  strategy?: "A" | "B" | "C"
}

export interface MatchResult {
  recipe: AIGeneratedRecipe
  availableMainIngredients: string[]
  missingMainIngredients: string[]
  matchingScore: number
  isAllAvailable: boolean
  cookingMethod: string
  cookingTime: number
  includesPinnedIngredient: boolean
}
