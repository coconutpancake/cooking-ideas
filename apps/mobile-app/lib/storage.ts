import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  type IngredientItem,
  type RecipeDetail,
  type RecipeRecommendation,
} from '@/lib/types';

const INGREDIENTS_KEY = 'cooking_ideas:ingredients';
const LAST_UPDATED_KEY = 'cooking_ideas:last_updated';
const RECOMMENDATIONS_CACHE_KEY = 'cooking_ideas:recommendations_cache';
const DETAIL_CACHE_PREFIX = 'cooking_ideas:detail:';

export interface RecommendationsCache {
  ingredientHash: string;
  savedAt: number;
  recommendations: RecipeRecommendation[];
}

export function getIngredientsHash(ingredients: IngredientItem[] | string[]) {
  const names = ingredients.map((item) => (typeof item === 'string' ? item : item.name));
  return names
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|');
}

export async function getIngredients(): Promise<IngredientItem[]> {
  const raw = await AsyncStorage.getItem(INGREDIENTS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IngredientItem[]) : [];
  } catch {
    return [];
  }
}

export async function saveIngredients(ingredients: IngredientItem[]) {
  await AsyncStorage.multiSet([
    [INGREDIENTS_KEY, JSON.stringify(ingredients)],
    [LAST_UPDATED_KEY, String(Date.now())],
  ]);
}

export async function getLastUpdated() {
  const raw = await AsyncStorage.getItem(LAST_UPDATED_KEY);
  const timestamp = raw ? Number(raw) : null;
  return timestamp && Number.isFinite(timestamp) ? timestamp : null;
}

export async function clearRecommendationsCache() {
  await AsyncStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
}

export async function getRecommendationsCache(): Promise<RecommendationsCache | null> {
  const raw = await AsyncStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as RecommendationsCache;
    return Array.isArray(parsed.recommendations) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveRecommendationsCache(
  recommendations: RecipeRecommendation[],
  ingredientHash: string,
) {
  await AsyncStorage.setItem(
    RECOMMENDATIONS_CACHE_KEY,
    JSON.stringify({
      ingredientHash,
      savedAt: Date.now(),
      recommendations,
    } satisfies RecommendationsCache),
  );
}

export async function getCachedRecipeRecommendation(recipeId: string) {
  const cache = await getRecommendationsCache();
  return cache?.recommendations.find((item) => item.recipeId === recipeId) ?? null;
}

export async function getRecipeDetailCache(recipeId: string): Promise<RecipeDetail | null> {
  const raw = await AsyncStorage.getItem(`${DETAIL_CACHE_PREFIX}${recipeId}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RecipeDetail;
  } catch {
    return null;
  }
}

export async function saveRecipeDetailCache(recipe: RecipeDetail) {
  await AsyncStorage.setItem(`${DETAIL_CACHE_PREFIX}${recipe.recipeId}`, JSON.stringify(recipe));
}
