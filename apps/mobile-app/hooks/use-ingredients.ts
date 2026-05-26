import { useCallback, useEffect, useState } from 'react';

import { type CategoryKey, type IngredientItem } from '@/lib/types';
import {
  clearRecommendationsCache,
  getIngredients,
  getLastUpdated,
  saveIngredients,
} from '@/lib/storage';

const meatKeywords = [
  '鸡',
  '鸭',
  '鱼',
  '虾',
  '牛',
  '猪',
  '羊',
  '肉',
  '蛋',
  '奶',
  '排骨',
  '火腿',
];

const vegetableKeywords = [
  '菜',
  '番茄',
  '西红柿',
  '土豆',
  '胡萝卜',
  '洋葱',
  '葱',
  '姜',
  '蒜',
  '豆角',
  '豆腐',
  '蘑菇',
  '青椒',
  '黄瓜',
  '茄子',
];

export function guessIngredientCategory(name: string): CategoryKey {
  if (meatKeywords.some((keyword) => name.includes(keyword))) {
    return 'meat';
  }

  if (vegetableKeywords.some((keyword) => name.includes(keyword))) {
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

  const togglePinned = useCallback(
    async (id: string) => {
      await persist(
        ingredients.map((item) =>
          item.id === id ? { ...item, isPinned: !item.isPinned } : item,
        ),
      );
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
          isPinned: false,
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
          isPinned: false,
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
    togglePinned,
  };
}
