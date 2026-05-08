export type CategoryKey = 'meat' | 'vegetable' | 'other';

export interface IngredientItem {
  id: string;
  name: string;
  category: CategoryKey;
}

export interface RecipeRecommendation {
  recipeId: string;
  title: string;
  emoji: string;
  matchingScore: number;
  cookingTime: number;
  cookingMethod: string;
  availableMainIngredients: string[];
  missingMainIngredients: string[];
  seasonings: string[];
  isAllAvailable: boolean;
}

export interface RecipeStep {
  order: number;
  description: string;
}

export interface RecipeDetail {
  recipeId: string;
  title: string;
  cookingTime: number;
  tags: string[];
  mainIngredients: { name: string; amount: string }[];
  seasonings: { name: string; amount: string }[];
  steps: RecipeStep[];
  tips: string;
}

export const categories: { key: CategoryKey; label: string }[] = [
  { key: 'meat', label: '肉蛋奶' },
  { key: 'vegetable', label: '蔬菜' },
  { key: 'other', label: '其他' },
];
