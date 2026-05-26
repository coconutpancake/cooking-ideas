import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  type IngredientItem,
  type LocalProfile,
  type MealPreferenceKey,
  type RecipeDetail,
  type RecipeRecommendation,
  type RecommendationContext,
  type UserPreferences,
} from '@/lib/types';

const INGREDIENTS_KEY = 'cooking_ideas:ingredients';
const LAST_UPDATED_KEY = 'cooking_ideas:last_updated';
const RECOMMENDATIONS_CACHE_KEY = 'cooking_ideas:recommendations_cache';
const RECOMMENDATIONS_REFRESH_MARKER_KEY = 'cooking_ideas:recommendations_refresh_marker';
const DETAIL_CACHE_PREFIX = 'cooking_ideas:detail:';
const PREFERENCES_KEY = 'cooking_ideas:user_preferences';
const PROFILE_KEY = 'cooking_ideas:local_profile';
const DEVICE_ID_KEY = 'cooking_ideas:device_id';
const MEAL_PREFERENCE_KEY = 'cooking_ideas:meal_preference';
const PIN_TOOLTIP_KEY = 'cooking_ideas:pin_tooltip_seen';

export const DEFAULT_PROFILE: LocalProfile = {
  nickname: '本地灵感大厨',
  avatarUri: null,
  updatedAt: 0,
};

export interface RecommendationsCache {
  contextHash: string;
  savedAt: number;
  recommendations: RecipeRecommendation[];
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

export function getIngredientsHash(ingredients: IngredientItem[] | string[]) {
  const names = ingredients.map((item) => (typeof item === 'string' ? item : item.name));
  return names.map(normalizeName).filter(Boolean).sort().join('|');
}

export function getRecommendationContextHash(context: RecommendationContext) {
  return JSON.stringify({
    ingredients: [...context.ingredients].map(normalizeName).sort(),
    pinnedIngredients: [...context.pinnedIngredients].map(normalizeName).sort(),
    mealPreference: context.mealPreference,
    goal: context.userPreferences?.goal ?? '',
    tastes: [...(context.userPreferences?.tastes ?? [])].map(normalizeName).sort(),
    avoidances: [...(context.userPreferences?.avoidances ?? [])].map(normalizeName).sort(),
  });
}

export async function getIngredients(): Promise<IngredientItem[]> {
  const parsed = safeJsonParse<IngredientItem[]>(await AsyncStorage.getItem(INGREDIENTS_KEY), []);
  return Array.isArray(parsed)
    ? parsed.filter((item) => item && typeof item.name === 'string')
    : [];
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

export async function getMealPreference(): Promise<MealPreferenceKey | null> {
  const raw = await AsyncStorage.getItem(MEAL_PREFERENCE_KEY);
  return raw ? (raw as MealPreferenceKey) : null;
}

export async function saveMealPreference(preference: MealPreferenceKey | null) {
  if (!preference) {
    await AsyncStorage.removeItem(MEAL_PREFERENCE_KEY);
    return;
  }

  await AsyncStorage.setItem(MEAL_PREFERENCE_KEY, preference);
}

export async function hasSeenPinTooltip() {
  return (await AsyncStorage.getItem(PIN_TOOLTIP_KEY)) === '1';
}

export async function markPinTooltipSeen() {
  await AsyncStorage.setItem(PIN_TOOLTIP_KEY, '1');
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  const parsed = safeJsonParse<UserPreferences | null>(
    await AsyncStorage.getItem(PREFERENCES_KEY),
    null,
  );

  if (!parsed || !parsed.completedOnboarding || !parsed.goal) {
    return null;
  }

  return {
    goal: parsed.goal,
    tastes: Array.isArray(parsed.tastes) ? parsed.tastes : [],
    avoidances: Array.isArray(parsed.avoidances) ? parsed.avoidances : [],
    completedOnboarding: true,
    updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
  };
}

export async function saveUserPreferences(preferences: Omit<UserPreferences, 'updatedAt'>) {
  const next: UserPreferences = {
    ...preferences,
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  return next;
}

export async function getLocalProfile(): Promise<LocalProfile> {
  const parsed = safeJsonParse<LocalProfile>(
    await AsyncStorage.getItem(PROFILE_KEY),
    DEFAULT_PROFILE,
  );

  return {
    nickname: typeof parsed.nickname === 'string' && parsed.nickname.trim()
      ? parsed.nickname.trim()
      : DEFAULT_PROFILE.nickname,
    avatarUri: typeof parsed.avatarUri === 'string' && parsed.avatarUri ? parsed.avatarUri : null,
    updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
  };
}

export async function saveLocalProfile(profile: Pick<LocalProfile, 'nickname' | 'avatarUri'>) {
  const next: LocalProfile = {
    nickname: profile.nickname.trim() || DEFAULT_PROFILE.nickname,
    avatarUri: profile.avatarUri,
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export async function getDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const next = `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

export async function clearRecommendationsCache() {
  await AsyncStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
}

export async function markRecommendationsNeedRefresh() {
  const marker = Date.now();
  await AsyncStorage.multiSet([
    [RECOMMENDATIONS_REFRESH_MARKER_KEY, String(marker)],
  ]);
  await clearRecommendationsCache();
  return marker;
}

export async function getRecommendationsRefreshMarker() {
  const raw = await AsyncStorage.getItem(RECOMMENDATIONS_REFRESH_MARKER_KEY);
  const marker = raw ? Number(raw) : 0;
  return Number.isFinite(marker) ? marker : 0;
}

export async function getRecommendationsCache(): Promise<RecommendationsCache | null> {
  const parsed = safeJsonParse<RecommendationsCache | null>(
    await AsyncStorage.getItem(RECOMMENDATIONS_CACHE_KEY),
    null,
  );

  return parsed && Array.isArray(parsed.recommendations) ? parsed : null;
}

export async function saveRecommendationsCache(
  recommendations: RecipeRecommendation[],
  contextHash: string,
) {
  await AsyncStorage.setItem(
    RECOMMENDATIONS_CACHE_KEY,
    JSON.stringify({
      contextHash,
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
  return safeJsonParse<RecipeDetail | null>(
    await AsyncStorage.getItem(`${DETAIL_CACHE_PREFIX}${recipeId}`),
    null,
  );
}

export async function saveRecipeDetailCache(recipe: RecipeDetail) {
  await AsyncStorage.setItem(`${DETAIL_CACHE_PREFIX}${recipe.recipeId}`, JSON.stringify(recipe));
}
