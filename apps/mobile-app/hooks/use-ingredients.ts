import { useCallback, useEffect, useState } from 'react';

import { type CategoryKey, type IngredientItem } from '@/lib/types';
import {
  clearRecommendationsCache,
  getIngredients,
  getLastUpdated,
  saveIngredients,
} from '@/lib/storage';

export function guessIngredientCategory(name: string): CategoryKey {
  if (/(鸡|牛|猪|羊|鱼|虾|肉|蛋|奶|排骨|培根|火腿)/.test(name)) {
    return 'meat';
  }

  if (/(菜|番茄|西红柿|椒|蘑|菇|瓜|豆角|土豆|胡萝卜|洋葱|葱|姜|蒜)/.test(name)) {
    return 'vegetable';
  }

  return 'other';
}

export function useIngredients() {
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storedIngredients, storedLastUpdated] = await Promise.all([
        getIngredients(),
        getLastUpdated(),
      ]);
      setIngredients(storedIngredients);
      setLastUpdated(storedLastUpdated);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = useCallback(async (nextIngredients: IngredientItem[]) => {
    setIngredients(nextIngredients);
    setIsSaving(true);

    try {
      await saveIngredients(nextIngredients);
      await clearRecommendationsCache();
      setLastUpdated(Date.now());
    } finally {
      setIsSaving(false);
    }
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await persist(ingredients.filter((item) => item.id !== id));
    },
    [ingredients, persist],
  );

  const add = useCallback(
    async (name: string, category?: CategoryKey) => {
      const normalized = name.trim();
      if (!normalized || ingredients.some((item) => item.name === normalized)) return;

      await persist([
        ...ingredients,
        {
          id: `${Date.now()}`,
          name: normalized,
          category: category ?? guessIngredientCategory(normalized),
        },
      ]);
    },
    [ingredients, persist],
  );

  const addRecognizedIngredients = useCallback(
    async (names: string[]) => {
      const existingNames = new Set(ingredients.map((item) => item.name));
      const additions: IngredientItem[] = names
        .map((name) => name.trim())
        .filter((name) => name && !existingNames.has(name))
        .map((name) => ({
          id: `${Date.now()}-${name}`,
          name,
          category: guessIngredientCategory(name),
        }));

      if (additions.length === 0) {
        return [];
      }

      await persist([...ingredients, ...additions]);
      return additions.map((item) => item.name);
    },
    [ingredients, persist],
  );

  return {
    ingredients,
    lastUpdated,
    isLoading,
    isSaving,
    reload: load,
    add,
    addRecognizedIngredients,
    remove,
  };
}
