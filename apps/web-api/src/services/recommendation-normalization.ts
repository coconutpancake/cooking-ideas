import "server-only"

import type { AIGeneratedRecipe, MatchResult } from "./recommendation-types"

export const DEFAULT_EMOJI = "🍽️"
export const DEFAULT_COOKING_METHOD = "炒"
export const DEFAULT_COOKING_TIME = 20

const INGREDIENT_ALIASES: Record<string, string[]> = {
  番茄: ["西红柿"],
  西红柿: ["番茄"],
  鸡蛋: ["蛋"],
  蛋: ["鸡蛋"],
  葱: ["大葱", "小葱", "香葱"],
  大葱: ["葱"],
  小葱: ["葱"],
  香葱: ["葱"],
  土豆: ["马铃薯"],
  马铃薯: ["土豆"],
  豆腐: ["嫩豆腐", "老豆腐", "北豆腐", "南豆腐"],
  嫩豆腐: ["豆腐"],
  老豆腐: ["豆腐"],
  北豆腐: ["豆腐"],
  南豆腐: ["豆腐"],
  牛里脊: ["牛肉", "牛肉片", "牛肉丝"],
  牛肉: ["牛肉片", "牛肉丝", "牛肉末", "牛里脊", "肥牛"],
  牛肉片: ["牛肉", "牛里脊", "肥牛"],
  牛肉丝: ["牛肉", "牛里脊"],
  牛肉末: ["牛肉"],
  肥牛: ["牛肉", "牛肉片"],
  猪肉: ["肉丝", "肉片", "肉末", "五花肉", "里脊肉", "瘦肉"],
  肉丝: ["猪肉", "里脊肉", "瘦肉"],
  肉片: ["猪肉", "五花肉", "瘦肉"],
  肉末: ["猪肉", "瘦肉"],
  五花肉: ["猪肉", "肉片"],
  里脊肉: ["猪肉", "肉丝", "瘦肉"],
  瘦肉: ["猪肉", "肉丝", "肉片", "肉末", "里脊肉"],
  羊肉: ["羊肉片", "羊肉卷", "羊腿肉"],
  羊肉片: ["羊肉", "羊肉卷"],
  羊肉卷: ["羊肉", "羊肉片"],
  羊腿肉: ["羊肉"],
  鸡胸肉: ["鸡肉", "鸡丁"],
  鸡腿肉: ["鸡肉", "鸡丁"],
  鸡肉: ["鸡胸肉", "鸡腿肉", "鸡丁"],
  鸡丁: ["鸡肉", "鸡胸肉", "鸡腿肉"],
  大虾: ["虾仁", "虾", "海虾"],
  虾仁: ["大虾", "虾", "海虾"],
  虾: ["大虾", "虾仁", "海虾"],
  海虾: ["大虾", "虾仁", "虾"],
  西兰花: ["绿菜花"],
  绿菜花: ["西兰花"],
  卷心菜: ["包菜", "圆白菜"],
  包菜: ["卷心菜", "圆白菜"],
  圆白菜: ["卷心菜", "包菜"],
  意大利面: ["意面", "意粉", "通心粉"],
  意面: ["意大利面", "意粉", "通心粉"],
  意粉: ["意大利面", "意面", "通心粉"],
  通心粉: ["意大利面", "意面", "意粉"],
}

const MEAT_FAMILIES = [
  {
    flexible: ["猪肉", "肉丝", "肉片", "肉末", "五花肉", "里脊肉", "瘦肉", "梅花肉"],
    strict: ["排骨", "猪蹄", "猪肝", "猪肚", "猪耳", "猪血", "猪大肠"],
  },
  {
    flexible: ["牛肉", "牛肉片", "牛肉丝", "牛肉末", "牛里脊", "肥牛"],
    strict: ["牛腩", "牛腱", "牛腱子", "牛排", "牛肋条", "牛尾", "牛百叶"],
  },
  {
    flexible: ["羊肉", "羊肉片", "羊肉卷", "羊腿肉"],
    strict: ["羊排", "羊蝎子", "羊蹄", "羊肝"],
  },
  {
    flexible: ["鸡肉", "鸡胸肉", "鸡腿肉", "鸡丁"],
    strict: ["鸡翅", "鸡爪", "鸡胗", "鸡心", "鸡架"],
  },
  {
    flexible: ["鸭肉", "鸭胸肉", "鸭腿肉"],
    strict: ["鸭翅", "鸭掌", "鸭胗", "鸭血"],
  },
]

const TITLE_INGREDIENT_KEYWORDS = [
  "猪肉",
  "肉丝",
  "肉片",
  "肉末",
  "五花肉",
  "里脊肉",
  "排骨",
  "猪蹄",
  "猪肝",
  "牛肉",
  "牛腩",
  "牛腱",
  "牛排",
  "牛肋条",
  "羊肉",
  "羊排",
  "鸡肉",
  "鸡胸肉",
  "鸡腿肉",
  "鸡翅",
  "鸡爪",
  "鸭肉",
  "鱼",
  "虾",
  "虾仁",
  "鸡蛋",
  "蛋",
  "鸭蛋",
  "鹌鹑蛋",
  "豆腐",
  "番茄",
  "西红柿",
  "土豆",
  "胡萝卜",
  "黄瓜",
  "丝瓜",
  "冬瓜",
  "苦瓜",
  "南瓜",
  "茄子",
  "青椒",
  "彩椒",
  "尖椒",
  "洋葱",
  "西兰花",
  "花菜",
  "白菜",
  "卷心菜",
  "包菜",
  "圆白菜",
  "菠菜",
  "生菜",
  "芹菜",
  "韭菜",
  "蘑菇",
  "杏鲍菇",
  "木耳",
  "香菇",
  "金针菇",
  "玉米",
  "苹果",
  "面粉",
  "糯米粉",
  "米饭",
  "面条",
  "意大利面",
  "意面",
  "意粉",
  "通心粉",
]

const SUBSTANTIAL_INGREDIENTS = new Set(TITLE_INGREDIENT_KEYWORDS.map(normalizeIngredientName))

const SEASONING_KEYWORD_PATTERNS = [
  /酱$/,
  /酱油$/,
  /汁$/,
  /油$/,
  /粉$/,
  /醋$/,
  /酒$/,
  /料酒$/,
  /盐$/,
  /糖$/,
  /胡椒$/,
  /水$/,
  /高汤$/,
  /番茄酱/,
  /豆瓣酱/,
  /黄豆酱/,
  /甜面酱/,
  /蚝油/,
  /生抽/,
  /老抽/,
  /淀粉/,
  /辣椒粉/,
  /五香粉/,
  /孜然粉/,
]

const KNOWN_DISH_REQUIRED_INGREDIENTS: Record<string, string[]> = {
  地三鲜: ["土豆", "茄子", "青椒"],
  鱼香肉丝: ["猪肉", "木耳", "胡萝卜"],
  宫保鸡丁: ["鸡肉", "花生"],
  番茄炒蛋: ["番茄", "鸡蛋"],
  西红柿炒蛋: ["西红柿", "鸡蛋"],
}

const METHOD_FAMILIES: Array<{ family: string; keywords: string[] }> = [
  { family: "braise", keywords: ["红烧", "烧", "炖", "焖", "煨", "煲", "卤"] },
  { family: "stir-fry", keywords: ["小炒", "快炒", "炒", "爆", "煸"] },
  { family: "soup", keywords: ["汤", "煮", "汆"] },
  { family: "steam", keywords: ["清蒸", "蒸"] },
  { family: "roast", keywords: ["烤", "焗"] },
  { family: "cold", keywords: ["凉拌", "拌"] },
  { family: "pan-fry", keywords: ["香煎", "煎"] },
  { family: "deep-fry", keywords: ["炸"] },
]

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, "").trim()
}

function canonicalizeIngredientName(name: string): string {
  const normalized = normalizeIngredientName(name)

  for (const [canonicalName, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    const canonical = normalizeIngredientName(canonicalName)
    if (
      normalized === canonical ||
      aliases.some((alias) => normalizeIngredientName(alias) === normalized)
    ) {
      return canonical
    }
  }

  return normalized
}

function titleContainsIngredientKeyword(title: string, keyword: string): boolean {
  const normalizedTitle = normalizeIngredientName(title)
  const normalizedKeyword = normalizeIngredientName(keyword)
  const index = normalizedTitle.indexOf(normalizedKeyword)

  if (index < 0) {
    return false
  }

  const nextChar = normalizedTitle[index + normalizedKeyword.length]
  if (["酱", "汁", "粉", "油"].includes(nextChar)) {
    return false
  }

  return true
}

function isSeasoningLikeIngredient(name: string): boolean {
  const normalized = normalizeIngredientName(name)
  return SEASONING_KEYWORD_PATTERNS.some((pattern) => pattern.test(normalized))
}

function resolveMeatFamilyMatch(userNorm: string, recipeNorm: string): boolean | null {
  for (const family of MEAT_FAMILIES) {
    const flexible = family.flexible.map(normalizeIngredientName)
    const strict = family.strict.map(normalizeIngredientName)
    const userIsFlexible = flexible.includes(userNorm)
    const recipeIsFlexible = flexible.includes(recipeNorm)
    const userStrictIndex = strict.indexOf(userNorm)
    const recipeStrictIndex = strict.indexOf(recipeNorm)
    const userIsStrict = userStrictIndex >= 0
    const recipeIsStrict = recipeStrictIndex >= 0

    if (!userIsFlexible && !recipeIsFlexible && !userIsStrict && !recipeIsStrict) {
      continue
    }

    if (userIsStrict || recipeIsStrict) {
      return userIsStrict && recipeIsStrict && userStrictIndex === recipeStrictIndex
    }

    return userIsFlexible && recipeIsFlexible
  }

  return null
}

function getMeatFamilyRole(ingredient: string): { familyIndex: number; role: "flexible" | "strict" } | null {
  const normalized = normalizeIngredientName(ingredient)

  for (const [familyIndex, family] of MEAT_FAMILIES.entries()) {
    if (family.flexible.map(normalizeIngredientName).includes(normalized)) {
      return { familyIndex, role: "flexible" }
    }

    if (family.strict.map(normalizeIngredientName).includes(normalized)) {
      return { familyIndex, role: "strict" }
    }
  }

  return null
}

function ingredientMatches(userIngredient: string, recipeIngredient: string): boolean {
  const userNorm = normalizeIngredientName(userIngredient)
  const recipeNorm = normalizeIngredientName(recipeIngredient)

  if (!userNorm || !recipeNorm) {
    return false
  }

  if (userNorm === recipeNorm) {
    return true
  }

  const meatFamilyMatch = resolveMeatFamilyMatch(userNorm, recipeNorm)
  if (meatFamilyMatch !== null) {
    return meatFamilyMatch
  }

  if (userNorm.includes(recipeNorm) || recipeNorm.includes(userNorm)) {
    return true
  }

  const userAliases = INGREDIENT_ALIASES[userNorm] || []
  const recipeAliases = INGREDIENT_ALIASES[recipeNorm] || []

  return userAliases.includes(recipeNorm) || recipeAliases.includes(userNorm)
}

export function calculateMatch(
  recipe: AIGeneratedRecipe,
  userIngredients: string[],
  pinnedIngredients: string[] = []
): MatchResult {
  const availableMainIngredients: string[] = []
  const missingMainIngredients: string[] = []
  let includesPinnedIngredient = false

  for (const mainIngredient of recipe.mainIngredients) {
    const found = userIngredients.some((userIngredient) =>
      ingredientMatches(userIngredient, mainIngredient)
    )
    const pinned = pinnedIngredients.some((pinnedIngredient) =>
      ingredientMatches(pinnedIngredient, mainIngredient)
    )

    if (found) {
      availableMainIngredients.push(mainIngredient)
    } else {
      missingMainIngredients.push(mainIngredient)
    }

    if (pinned) {
      includesPinnedIngredient = true
    }
  }

  const matchingScore =
    recipe.mainIngredients.length > 0
      ? availableMainIngredients.length / recipe.mainIngredients.length
      : 0

  return {
    recipe,
    availableMainIngredients,
    missingMainIngredients,
    matchingScore,
    isAllAvailable: missingMainIngredients.length === 0,
    cookingMethod: recipe.cookingMethod || DEFAULT_COOKING_METHOD,
    cookingTime: recipe.cookingTime || DEFAULT_COOKING_TIME,
    includesPinnedIngredient,
  }
}

function getStrategyRank(strategy?: "A" | "B" | "C"): number {
  if (strategy === "A") return 0
  if (strategy === "B") return 1
  return 2
}

interface SortOptions {
  mealPreference?: string | null
  userPreferences?: {
    tastes: string[]
  } | null
}

function getConstraintScore(result: MatchResult, options: SortOptions): number {
  let score = 0
  const hasMealPreference = Boolean(options.mealPreference?.trim())
  const hasLongTermTastePreference = Boolean(options.userPreferences?.tastes?.length)

  if (result.includesPinnedIngredient) {
    score += 4
  }

  if (hasMealPreference && (result.recipe.strategy === "A" || result.recipe.strategy === "B")) {
    score += 2
  }

  if (hasLongTermTastePreference && result.recipe.strategy === "A") {
    score += 1
  }

  if (result.recipe.strategy === "A") {
    score += 0.5
  } else if (result.recipe.strategy === "B") {
    score += 0.25
  }

  return score
}

function getCookingMethodFamily(method?: string, title?: string): string {
  const text = `${method || ""} ${title || ""}`

  for (const { family, keywords } of METHOD_FAMILIES) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return family
    }
  }

  return normalizeIngredientName(method || DEFAULT_COOKING_METHOD) || "other"
}

function extractTitleIngredientKeys(title: string): string[] {
  const keys = new Set<string>()
  const keywords = [...TITLE_INGREDIENT_KEYWORDS].sort((a, b) => b.length - a.length)

  for (const keyword of keywords) {
    if (titleContainsIngredientKeyword(title, keyword)) {
      keys.add(canonicalizeIngredientName(keyword))
    }
  }

  return [...keys]
}

function getRecipeSimilarityKey(recipe: AIGeneratedRecipe): string | null {
  const ingredientKeys = new Set<string>()

  for (const ingredient of recipe.mainIngredients) {
    const key = canonicalizeIngredientName(ingredient)
    if (key) {
      ingredientKeys.add(key)
    }
  }

  for (const key of extractTitleIngredientKeys(recipe.title)) {
    ingredientKeys.add(key)
  }

  if (ingredientKeys.size === 0) {
    return null
  }

  const family = getCookingMethodFamily(recipe.cookingMethod, recipe.title)

  return `${family}:${[...ingredientKeys].sort().join("+")}`
}

function getTitleSimilarityKey(title: string): string | null {
  const ingredientKeys = extractTitleIngredientKeys(title)

  if (ingredientKeys.length === 0) {
    return null
  }

  return `${getCookingMethodFamily(undefined, title)}:${ingredientKeys.sort().join("+")}`
}

export function removeSimilarRecommendations(
  results: MatchResult[],
  excludedTitles: string[] = []
): MatchResult[] {
  const seenTitles = new Set(excludedTitles.map((title) => title.toLowerCase().trim()))
  const seenSimilarityKeys = new Set(
    excludedTitles
      .map(getTitleSimilarityKey)
      .filter((key): key is string => Boolean(key))
  )
  const uniqueResults: MatchResult[] = []

  for (const result of results) {
    const titleKey = result.recipe.title.toLowerCase().trim()
    const similarityKey = getRecipeSimilarityKey(result.recipe)

    if (seenTitles.has(titleKey) || (similarityKey && seenSimilarityKeys.has(similarityKey))) {
      continue
    }

    uniqueResults.push(result)
    seenTitles.add(titleKey)

    if (similarityKey) {
      seenSimilarityKeys.add(similarityKey)
    }
  }

  return uniqueResults
}

export function sortPersonalizedRecommendations(
  results: MatchResult[],
  options: SortOptions = {}
): MatchResult[] {
  return results.sort((a, b) => {
    if (Math.abs(a.matchingScore - b.matchingScore) > 0.01) {
      return b.matchingScore - a.matchingScore
    }

    const constraintDelta = getConstraintScore(b, options) - getConstraintScore(a, options)
    if (Math.abs(constraintDelta) > 0.01) {
      return constraintDelta
    }

    if (a.includesPinnedIngredient !== b.includesPinnedIngredient) {
      return a.includesPinnedIngredient ? -1 : 1
    }

    const strategyDelta = getStrategyRank(a.recipe.strategy) - getStrategyRank(b.recipe.strategy)
    if (strategyDelta !== 0) {
      return strategyDelta
    }

    if (a.missingMainIngredients.length !== b.missingMainIngredients.length) {
      return a.missingMainIngredients.length - b.missingMainIngredients.length
    }

    return a.cookingTime - b.cookingTime
  })
}

export function enrichMainIngredientsFromTitle(title: string, mainIngredients: string[]): string[] {
  const normalizedTitle = normalizeIngredientName(title)
  const next = [...mainIngredients]
  const existing = new Set(next.map(normalizeIngredientName))

  for (const [dishName, requiredIngredients] of Object.entries(KNOWN_DISH_REQUIRED_INGREDIENTS)) {
    if (!normalizedTitle.includes(normalizeIngredientName(dishName))) {
      continue
    }

    for (const ingredient of requiredIngredients) {
      const normalizedIngredient = normalizeIngredientName(ingredient)
      if (!existing.has(normalizedIngredient)) {
        next.push(ingredient)
        existing.add(normalizedIngredient)
      }
    }
  }

  for (const keyword of TITLE_INGREDIENT_KEYWORDS) {
    const normalizedKeyword = normalizeIngredientName(keyword)
    if (titleContainsIngredientKeyword(title, keyword) && !existing.has(normalizedKeyword)) {
      next.push(keyword)
      existing.add(normalizedKeyword)
    }
  }

  return next
}

function titleMentionsIngredient(title: string, ingredient: string): boolean {
  const normalizedTitle = normalizeIngredientName(title)
  const normalizedIngredient = normalizeIngredientName(ingredient)
  if (normalizedTitle.includes(normalizedIngredient)) {
    return true
  }

  const aliases = INGREDIENT_ALIASES[normalizedIngredient] || []
  return aliases.some((alias) => normalizedTitle.includes(normalizeIngredientName(alias)))
}

function getKnownDishRequiredSet(title: string): Set<string> {
  const normalizedTitle = normalizeIngredientName(title)
  const required = new Set<string>()

  for (const [dishName, ingredients] of Object.entries(KNOWN_DISH_REQUIRED_INGREDIENTS)) {
    if (normalizedTitle.includes(normalizeIngredientName(dishName))) {
      ingredients.forEach((ingredient) => required.add(normalizeIngredientName(ingredient)))
    }
  }

  return required
}

function chooseIngredientDisplayName(
  current: string,
  candidate: string,
  userIngredients: string[]
): string {
  const currentFromUser = userIngredients.some(
    (userIngredient) => normalizeIngredientName(userIngredient) === normalizeIngredientName(current)
  )
  const candidateFromUser = userIngredients.some(
    (userIngredient) => normalizeIngredientName(userIngredient) === normalizeIngredientName(candidate)
  )

  if (candidateFromUser && !currentFromUser) {
    return candidate
  }

  if (currentFromUser && !candidateFromUser) {
    return current
  }

  return current.length <= candidate.length ? current : candidate
}

export function normalizeMainIngredientsForContext(
  recipe: AIGeneratedRecipe,
  userIngredients: string[]
): AIGeneratedRecipe {
  const deduped: string[] = []

  for (const ingredient of recipe.mainIngredients) {
    const duplicateIndex = deduped.findIndex((existing) =>
      ingredientMatches(existing, ingredient) || ingredientMatches(ingredient, existing)
    )

    if (duplicateIndex >= 0) {
      deduped[duplicateIndex] = chooseIngredientDisplayName(
        deduped[duplicateIndex],
        ingredient,
        userIngredients
      )
    } else {
      deduped.push(ingredient)
    }
  }

  const knownDishRequired = getKnownDishRequiredSet(recipe.title)
  const strictFamiliesInRecipe = new Set(
    deduped
      .map(getMeatFamilyRole)
      .filter((item): item is { familyIndex: number; role: "flexible" | "strict" } =>
        item !== null && item.role === "strict"
      )
      .map((item) => item.familyIndex)
  )
  const simplified = deduped.filter((ingredient) => {
    const normalized = normalizeIngredientName(ingredient)
    const meatRole = getMeatFamilyRole(ingredient)
    if (
      meatRole?.role === "flexible" &&
      strictFamiliesInRecipe.has(meatRole.familyIndex) &&
      !titleMentionsIngredient(recipe.title, ingredient)
    ) {
      return false
    }

    if (titleMentionsIngredient(recipe.title, ingredient) || knownDishRequired.has(normalized)) {
      return true
    }

    const userHasIngredient = userIngredients.some((userIngredient) =>
      ingredientMatches(userIngredient, ingredient)
    )
    if (userHasIngredient) {
      return true
    }

    const remainingAvailableCount = deduped.filter(
      (candidate) =>
        candidate !== ingredient &&
        userIngredients.some((userIngredient) => ingredientMatches(userIngredient, candidate))
    ).length

    return remainingAvailableCount < 2
  })

  return {
    ...recipe,
    mainIngredients: simplified.length > 0 ? simplified : deduped,
  }
}

export function splitSubstantialIngredients(
  mainIngredients: string[],
  seasonings: string[]
): { mainIngredients: string[]; seasonings: string[] } {
  const normalizedMain = new Set(mainIngredients.map(normalizeIngredientName))
  const nextMain: string[] = []
  const nextSeasonings: string[] = []

  for (const ingredient of mainIngredients) {
    const normalized = normalizeIngredientName(ingredient)
    if (isSeasoningLikeIngredient(ingredient)) {
      if (!nextSeasonings.some((item) => normalizeIngredientName(item) === normalized)) {
        nextSeasonings.push(ingredient)
      }
      continue
    }

    if (!nextMain.some((item) => normalizeIngredientName(item) === normalized)) {
      nextMain.push(ingredient)
    }
  }

  for (const seasoning of seasonings) {
    const normalized = normalizeIngredientName(seasoning)
    if (isSeasoningLikeIngredient(seasoning)) {
      if (!nextSeasonings.some((item) => normalizeIngredientName(item) === normalized)) {
        nextSeasonings.push(seasoning)
      }
    } else if (SUBSTANTIAL_INGREDIENTS.has(normalized) && !normalizedMain.has(normalized)) {
      nextMain.push(seasoning)
      normalizedMain.add(normalized)
    } else {
      nextSeasonings.push(seasoning)
    }
  }

  return {
    mainIngredients: nextMain,
    seasonings: nextSeasonings,
  }
}
