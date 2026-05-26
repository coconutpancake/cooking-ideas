import { useCallback, useState } from 'react';

import { fetchRecommendations } from '@/src/api/client';
import type { RecipeRecommendation, RecommendationContext } from '@/lib/types';
import {
  clearRecommendationsCache,
  getDeviceId,
  getIngredients,
  getMealPreference,
  getRecommendationContextHash,
  getRecommendationsCache,
  getUserPreferences,
  saveRecommendationsCache,
} from '@/lib/storage';

const INITIAL_PAGE_SIZE = 10;
const LOAD_MORE_PAGE_SIZE = 8;

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message.includes('429') || message.includes('频繁') || message.includes('too frequent')) {
    return '请求太频繁啦，大厨需要喝口水休息一下';
  }

  if (message.includes('timeout') || message.includes('超时')) {
    return '生成时间有点久，请稍后再试';
  }

  return message || '服务器开小差了，请稍后再试';
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [pinnedIngredients, setPinnedIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildContext = useCallback(
    async (options?: { excludeRecipeTitles?: string[]; pageSize?: number }) => {
      const [ingredients, preferences, mealPreference] = await Promise.all([
        getIngredients(),
        getUserPreferences(),
        getMealPreference(),
      ]);
      const ingredientNames = ingredients.map((item) => item.name);
      const pinnedNames = ingredients.filter((item) => item.isPinned).map((item) => item.name);

      setUserIngredients(ingredientNames);
      setPinnedIngredients(pinnedNames);

      return {
        ingredients: ingredientNames,
        pinnedIngredients: pinnedNames,
        mealPreference,
        userPreferences: preferences,
        excludeRecipeTitles: options?.excludeRecipeTitles ?? [],
        pageSize: options?.pageSize ?? INITIAL_PAGE_SIZE,
      } satisfies RecommendationContext;
    },
    [],
  );

  const loadRecommendations = useCallback(
    async (options?: { force?: boolean }) => {
      setIsLoading(true);
      setError(null);

      try {
        const context = await buildContext({ pageSize: INITIAL_PAGE_SIZE });

        if (context.ingredients.length === 0) {
          setRecommendations([]);
          setError('请先在冰箱里添加食材，我会为你推荐合适的菜谱');
          return;
        }

        const contextHash = getRecommendationContextHash(context);
        if (!options?.force) {
          const cache = await getRecommendationsCache();
          if (cache?.contextHash === contextHash && cache.recommendations.length > 0) {
            setRecommendations(cache.recommendations);
            return;
          }
        }

        const deviceId = await getDeviceId();
        const response = await fetchRecommendations(context, deviceId);
        const nextRecommendations = response.data.recommendations;
        setRecommendations(nextRecommendations);
        await saveRecommendationsCache(nextRecommendations, contextHash);
      } catch (loadError) {
        setRecommendations([]);
        setError(friendlyError(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    [buildContext],
  );

  const refreshRecommendations = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await clearRecommendationsCache();
      await loadRecommendations({ force: true });
    } finally {
      setIsRefreshing(false);
    }
  }, [loadRecommendations]);

  const loadMoreRecommendations = useCallback(async () => {
    if (isLoadingMore || recommendations.length === 0) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const context = await buildContext({
        excludeRecipeTitles: recommendations.map((item) => item.title),
        pageSize: LOAD_MORE_PAGE_SIZE,
      });
      const deviceId = await getDeviceId();
      const response = await fetchRecommendations(context, deviceId);
      const existingTitles = new Set(recommendations.map((item) => item.title));
      const additions = response.data.recommendations.filter((item) => !existingTitles.has(item.title));
      const nextRecommendations = [...recommendations, ...additions];

      setRecommendations(nextRecommendations);
      await saveRecommendationsCache(nextRecommendations, getRecommendationContextHash(context));
    } catch (loadError) {
      setError(friendlyError(loadError));
    } finally {
      setIsLoadingMore(false);
    }
  }, [buildContext, isLoadingMore, recommendations]);

  return {
    recommendations,
    userIngredients,
    pinnedIngredients,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    loadRecommendations,
    refreshRecommendations,
    loadMoreRecommendations,
  };
}
