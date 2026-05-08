import { useCallback, useState } from 'react';

import { fetchRecommendations } from '@/src/api/client';
import type { RecipeRecommendation } from '@/lib/mock-data';
import {
  clearRecommendationsCache,
  getIngredients,
  getIngredientsHash,
  getRecommendationsCache,
  saveRecommendationsCache,
} from '@/lib/storage';

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async (options?: { force?: boolean }) => {
    setIsLoading(true);
    setError(null);

    try {
      const ingredients = await getIngredients();
      const ingredientNames = ingredients.map((item) => item.name);
      const ingredientHash = getIngredientsHash(ingredients);
      setUserIngredients(ingredientNames);

      if (ingredientNames.length === 0) {
        setRecommendations([]);
        setError('请先在首页添加食材，我会为你推荐合适的菜谱');
        return;
      }

      if (!options?.force) {
        const cache = await getRecommendationsCache();
        if (cache?.ingredientHash === ingredientHash && cache.recommendations.length > 0) {
          setRecommendations(cache.recommendations);
          return;
        }
      }

      const response = await fetchRecommendations(ingredientNames);
      const nextRecommendations = response.data.recommendations;
      setRecommendations(nextRecommendations);
      await saveRecommendationsCache(nextRecommendations, ingredientHash);
    } catch (loadError) {
      setRecommendations([]);
      setError(loadError instanceof Error ? loadError.message : '获取推荐失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshRecommendations = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await clearRecommendationsCache();
      await loadRecommendations({ force: true });
    } finally {
      setIsRefreshing(false);
    }
  }, [loadRecommendations]);

  return {
    recommendations,
    userIngredients,
    isLoading,
    isRefreshing,
    error,
    loadRecommendations,
    refreshRecommendations,
  };
}
