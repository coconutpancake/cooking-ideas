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

export const mockIngredients: IngredientItem[] = [
  { id: '1', name: '鸡胸肉', category: 'meat' },
  { id: '2', name: '鸡蛋', category: 'meat' },
  { id: '3', name: '番茄', category: 'vegetable' },
  { id: '4', name: '西兰花', category: 'vegetable' },
  { id: '5', name: '口蘑', category: 'vegetable' },
  { id: '6', name: '豆腐', category: 'other' },
  { id: '7', name: '米饭', category: 'other' },
];

export const mockRecommendations: RecipeRecommendation[] = [
  {
    recipeId: 'tomato-egg',
    title: '番茄滑蛋盖饭',
    emoji: '🍅',
    matchingScore: 0.96,
    cookingTime: 15,
    cookingMethod: '炒',
    availableMainIngredients: ['番茄', '鸡蛋', '米饭'],
    missingMainIngredients: [],
    seasonings: ['盐', '生抽', '葱花'],
    isAllAvailable: true,
  },
  {
    recipeId: 'broccoli-chicken',
    title: '西兰花鸡胸肉',
    emoji: '🥦',
    matchingScore: 0.88,
    cookingTime: 22,
    cookingMethod: '煎',
    availableMainIngredients: ['西兰花', '鸡胸肉'],
    missingMainIngredients: ['蒜'],
    seasonings: ['黑胡椒', '盐', '橄榄油'],
    isAllAvailable: false,
  },
  {
    recipeId: 'mushroom-tofu',
    title: '口蘑豆腐汤',
    emoji: '🍲',
    matchingScore: 0.82,
    cookingTime: 18,
    cookingMethod: '煮',
    availableMainIngredients: ['口蘑', '豆腐'],
    missingMainIngredients: ['香菜'],
    seasonings: ['盐', '白胡椒', '香油'],
    isAllAvailable: false,
  },
  {
    recipeId: 'egg-tofu-steam',
    title: '鸡蛋蒸豆腐',
    emoji: '🥚',
    matchingScore: 0.78,
    cookingTime: 20,
    cookingMethod: '蒸',
    availableMainIngredients: ['鸡蛋', '豆腐'],
    missingMainIngredients: [],
    seasonings: ['生抽', '香油', '葱花'],
    isAllAvailable: true,
  },
];

export const mockRecipeDetails: Record<string, RecipeDetail> = {
  'tomato-egg': {
    recipeId: 'tomato-egg',
    title: '番茄滑蛋盖饭',
    cookingTime: 15,
    tags: ['简单', '2人份'],
    mainIngredients: [
      { name: '番茄', amount: '2个' },
      { name: '鸡蛋', amount: '2个' },
      { name: '米饭', amount: '1碗' },
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '生抽', amount: '1勺' },
      { name: '葱花', amount: '适量' },
    ],
    steps: [
      { order: 1, description: '番茄切块，鸡蛋加少许盐打散，米饭提前盛好备用。' },
      { order: 2, description: '锅中少油加热，倒入鸡蛋滑散，凝固后先盛出。' },
      { order: 3, description: '放入番茄炒出汁水，加生抽和少量清水煮至浓稠。' },
      { order: 4, description: '倒回鸡蛋翻匀，盖在米饭上，撒葱花即可。' },
    ],
    tips: '番茄先炒出沙感再回锅鸡蛋，味道更自然，不需要额外加糖也会有鲜甜感。',
  },
  'broccoli-chicken': {
    recipeId: 'broccoli-chicken',
    title: '西兰花鸡胸肉',
    cookingTime: 22,
    tags: ['高蛋白', '2人份'],
    mainIngredients: [
      { name: '西兰花', amount: '半颗' },
      { name: '鸡胸肉', amount: '1块' },
      { name: '蒜', amount: '2瓣' },
    ],
    seasonings: [
      { name: '黑胡椒', amount: '少许' },
      { name: '盐', amount: '少许' },
      { name: '橄榄油', amount: '1勺' },
    ],
    steps: [
      { order: 1, description: '鸡胸肉切片，用盐和黑胡椒抓匀腌制 8 分钟。' },
      { order: 2, description: '西兰花焯水 40 秒，捞出沥干，蒜切末备用。' },
      { order: 3, description: '平底锅放橄榄油，煎鸡胸肉至两面微黄。' },
      { order: 4, description: '加入西兰花和蒜末快速翻匀，补少许盐调味。' },
    ],
    tips: '鸡胸肉不要煎太久，看到边缘变白后翻面，口感会更嫩。',
  },
  'mushroom-tofu': {
    recipeId: 'mushroom-tofu',
    title: '口蘑豆腐汤',
    cookingTime: 18,
    tags: ['清淡', '2人份'],
    mainIngredients: [
      { name: '口蘑', amount: '6朵' },
      { name: '豆腐', amount: '半盒' },
      { name: '香菜', amount: '少许' },
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '白胡椒', amount: '少许' },
      { name: '香油', amount: '几滴' },
    ],
    steps: [
      { order: 1, description: '口蘑切片，豆腐切小块，香菜切碎。' },
      { order: 2, description: '锅中少油煎口蘑至微黄，加入热水煮开。' },
      { order: 3, description: '放入豆腐小火煮 6 分钟，加盐和白胡椒。' },
      { order: 4, description: '出锅前滴香油，撒香菜即可。' },
    ],
    tips: '口蘑先煎再煮，汤底会更鲜，不需要复杂高汤。',
  },
  'egg-tofu-steam': {
    recipeId: 'egg-tofu-steam',
    title: '鸡蛋蒸豆腐',
    cookingTime: 20,
    tags: ['家常', '2人份'],
    mainIngredients: [
      { name: '鸡蛋', amount: '2个' },
      { name: '豆腐', amount: '半盒' },
    ],
    seasonings: [
      { name: '生抽', amount: '1勺' },
      { name: '香油', amount: '几滴' },
      { name: '葱花', amount: '适量' },
    ],
    steps: [
      { order: 1, description: '豆腐切片铺入浅盘，鸡蛋打散后加等量温水。' },
      { order: 2, description: '蛋液过滤后倒入盘中，盖上保鲜膜扎几个小孔。' },
      { order: 3, description: '水开后上锅中小火蒸 10 到 12 分钟。' },
      { order: 4, description: '淋生抽和香油，撒葱花即可。' },
    ],
    tips: '蛋液过筛后质地更细腻，蒸的时候保持中小火可以减少气孔。',
  },
};
