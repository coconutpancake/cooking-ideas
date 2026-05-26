export type CategoryKey = 'meat' | 'vegetable' | 'other';

export interface IngredientItem {
  id: string;
  name: string;
  category: CategoryKey;
  isPinned?: boolean;
}

export type MealPreferenceKey = 'speed' | 'comfort' | 'light' | 'protein' | 'lessOil';

export interface MealPreferenceOption {
  key: MealPreferenceKey;
  label: string;
  description: string;
}

export interface UserPreferences {
  goal: string;
  tastes: string[];
  avoidances: string[];
  completedOnboarding: boolean;
  updatedAt: number;
}

export interface LocalProfile {
  nickname: string;
  avatarUri: string | null;
  updatedAt: number;
}

export interface RecommendationContext {
  ingredients: string[];
  pinnedIngredients: string[];
  mealPreference: MealPreferenceKey | null;
  userPreferences: UserPreferences | null;
  excludeRecipeTitles?: string[];
  pageSize?: number;
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
  strategy?: 'A' | 'B' | 'C';
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

export const mealPreferenceOptions: MealPreferenceOption[] = [
  { key: 'speed', label: '极速快手', description: '优先 20 分钟内能上桌' },
  { key: 'comfort', label: '下饭解馋', description: '口味更浓郁，适合配米饭' },
  { key: 'light', label: '清淡养生', description: '少油少盐，吃完不负担' },
  { key: 'protein', label: '高蛋白', description: '优先蛋白质更充足的搭配' },
  { key: 'lessOil', label: '少油少盐', description: '减少重油重调味做法' },
];
