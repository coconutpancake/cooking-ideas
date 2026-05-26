import "server-only"

import {
  DEFAULT_COOKING_METHOD,
  DEFAULT_COOKING_TIME,
  DEFAULT_EMOJI,
  enrichMainIngredientsFromTitle,
  splitSubstantialIngredients,
} from "./recommendation-normalization"
import type { AIGeneratedRecipe } from "./recommendation-types"

function splitList(value: string): string[] {
  return value
    .split(/[,\uFF0C\u3001/]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 1 && item.length <= 20)
}

function tryAddRecipe(
  item: unknown,
  results: AIGeneratedRecipe[],
  seenTitles: Set<string>
): void {
  if (!item || typeof item !== "object") {
    return
  }

  const obj = item as Record<string, unknown>
  const rawTitle = obj.title ?? obj.t
  const title = typeof rawTitle === "string" ? rawTitle.trim() : ""

  if (!title || title.length < 2 || title.length > 30 || seenTitles.has(title)) {
    return
  }

  const rawMainIngredients = obj.mainIngredients ?? obj.m ?? []
  let mainIngredients = Array.isArray(rawMainIngredients)
    ? rawMainIngredients
        .filter((ingredient): ingredient is string => typeof ingredient === "string")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length >= 1 && ingredient.length <= 20)
    : typeof rawMainIngredients === "string"
      ? splitList(rawMainIngredients)
      : []

  if (mainIngredients.length === 0) {
    return
  }

  mainIngredients = enrichMainIngredientsFromTitle(title, mainIngredients)

  const rawSeasonings = obj.seasonings ?? obj.s ?? []
  let seasonings = Array.isArray(rawSeasonings)
    ? rawSeasonings
        .filter((seasoning): seasoning is string => typeof seasoning === "string")
        .map((seasoning) => seasoning.trim())
        .filter((seasoning) => seasoning.length >= 1 && seasoning.length <= 20)
    : typeof rawSeasonings === "string"
      ? splitList(rawSeasonings)
      : []

  const classified = splitSubstantialIngredients(mainIngredients, seasonings)
  mainIngredients = classified.mainIngredients
  seasonings = classified.seasonings

  const rawCookingMethod = obj.cookingMethod ?? obj.c
  const cookingMethod =
    typeof rawCookingMethod === "string" && rawCookingMethod.trim()
      ? rawCookingMethod.trim()
      : DEFAULT_COOKING_METHOD

  const rawCookingTime = obj.cookingTime ?? obj.d
  const cookingTime =
    typeof rawCookingTime === "number" && Number.isFinite(rawCookingTime)
      ? Math.max(1, Math.round(rawCookingTime))
      : DEFAULT_COOKING_TIME

  const rawEmoji = obj.emoji ?? obj.e
  const emoji =
    typeof rawEmoji === "string" && rawEmoji.trim() && rawEmoji.trim().length <= 4
      ? rawEmoji.trim()
      : DEFAULT_EMOJI

  results.push({
    title,
    emoji,
    mainIngredients,
    seasonings,
    cookingMethod,
    cookingTime,
    strategy: obj.strategy === "A" || obj.strategy === "B" || obj.strategy === "C" ? obj.strategy : undefined,
  })
  seenTitles.add(title)
}

export function parseRecommendationResponse(content: string, maxItems = 10): AIGeneratedRecipe[] {
  const results: AIGeneratedRecipe[] = []
  const seenTitles = new Set<string>()
  const cleaned = content.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()

  const collectRecipes = (items: unknown[]) => {
    for (const item of items) {
      tryAddRecipe(item, results, seenTitles)

      if (results.length >= maxItems) {
        break
      }
    }
  }

  const collectParsed = (parsed: unknown) => {
    if (Array.isArray(parsed)) {
      collectRecipes(parsed)
      return
    }

    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>
      const nested =
        obj.recommendations ||
        obj.recipes ||
        obj.data ||
        obj.items ||
        obj.result

      if (Array.isArray(nested)) {
        collectRecipes(nested)
        return
      }

      tryAddRecipe(parsed, results, seenTitles)
    }
  }

  try {
    collectParsed(JSON.parse(cleaned))
  } catch {}

  if (results.length >= maxItems) {
    return results.slice(0, maxItems)
  }

  const arrayStart = cleaned.indexOf("[")
  const arrayEnd = cleaned.lastIndexOf("]")
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    try {
      collectParsed(JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1)))
    } catch {}
  }

  if (results.length >= maxItems) {
    return results.slice(0, maxItems)
  }

  const arrayMatches = cleaned.match(/\[[\s\S]*?\]/g) || []
  for (const arrayString of arrayMatches) {
    try {
      const parsed = JSON.parse(arrayString)
      if (Array.isArray(parsed)) {
        collectRecipes(parsed)
      }
    } catch {}

    if (results.length >= maxItems) {
      return results.slice(0, maxItems)
    }
  }

  const objectMatches = cleaned.match(/\{[\s\S]*?\}/g) || []
  for (const objectString of objectMatches) {
    try {
      const parsed = JSON.parse(objectString)
      tryAddRecipe(parsed, results, seenTitles)
    } catch {}

    if (results.length >= maxItems) {
      return results.slice(0, maxItems)
    }
  }

  return results.slice(0, maxItems)
}
