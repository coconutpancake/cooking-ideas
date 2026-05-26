import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  IngredientList,
  RecipeHeader,
  RetryButton,
  StepList,
  TipsCard,
} from '@/components/recipe-detail';
import type { RecipeDetail } from '@/lib/types';
import { fetchRecipeDetail } from '@/src/api/client';
import { getCachedRecipeRecommendation, getIngredients, getRecipeDetailCache, saveRecipeDetailCache } from '@/lib/storage';
import {
  classifyRecipeIngredients,
  estimateMainIngredientAmount,
  estimateSeasoningAmount,
} from '@/lib/recipe-ingredients';

const commonStepHighlightKeywords = [
  '葱',
  '姜',
  '蒜',
  '盐',
  '糖',
  '酱油',
  '生抽',
  '老抽',
  '醋',
  '料酒',
  '蚝油',
  '淀粉',
  '胡椒粉',
  '辣椒',
  '花椒',
  '八角',
  '香叶',
  '豆瓣酱',
  '鸡精',
  '香油',
  '食用油',
  '清水',
];

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [availableNames, setAvailableNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadRecipeDetail() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [ingredients, cachedDetail, recommendation] = await Promise.all([
          getIngredients(),
          getRecipeDetailCache(id),
          getCachedRecipeRecommendation(id),
        ]);
        const ingredientNames = ingredients.map((item) => item.name);

        if (!isMounted) return;
        setAvailableNames(ingredientNames);

        if (cachedDetail) {
          setRecipe(cachedDetail);
          setIsLoading(false);
          return;
        }

        if (!recommendation) {
          setRecipe(null);
          setError('菜谱不存在');
          setIsLoading(false);
          return;
        }

        const rawMainIngredientNames = [
          ...recommendation.availableMainIngredients,
          ...recommendation.missingMainIngredients,
        ];
        const classifiedIngredients = classifyRecipeIngredients(
          rawMainIngredientNames,
          recommendation.seasonings,
        );
        const mainIngredientNames = classifiedIngredients.mainIngredients;
        const response = await fetchRecipeDetail({
          recipeName: recommendation.title,
          mainIngredients: mainIngredientNames,
          availableIngredients: ingredientNames,
        });
        const nextRecipe: RecipeDetail = {
          recipeId: recommendation.recipeId,
          title: recommendation.title,
          cookingTime: recommendation.cookingTime,
          tags: [recommendation.cookingMethod, '2人份'],
          mainIngredients: mainIngredientNames.map((name) => ({
            name,
            amount: estimateMainIngredientAmount(name),
          })),
          seasonings: classifiedIngredients.seasonings.map((name) => ({
            name,
            amount: estimateSeasoningAmount(name),
          })),
          steps: response.steps,
          tips: response.tips || '',
        };

        if (!isMounted) return;
        setRecipe(nextRecipe);
        await saveRecipeDetailCache(nextRecipe);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : '';
        setError(
          message.includes('频繁') || message.includes('429')
            ? '请求太频繁啦，大厨需要喝口水休息一下'
            : '服务器开小差了，请稍后再试',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecipeDetail();

    return () => {
      isMounted = false;
    };
  }, [id, retryKey]);

  const highlightKeywords = useMemo(() => {
    if (!recipe) return [];
    return [
      ...recipe.mainIngredients.map((item) => item.name),
      ...recipe.seasonings.map((item) => item.name),
      ...commonStepHighlightKeywords,
    ];
  }, [recipe]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center px-5">
          <ActivityIndicator color="#f97316" />
          <Text className="mt-4 text-sm text-gray-400">正在生成做法步骤...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe || error) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-sm text-gray-400">{error || '菜谱不存在'}</Text>
          <RetryButton onPress={() => setRetryKey((current) => current + 1)} />
          <TouchableOpacity activeOpacity={0.75} onPress={() => router.replace('/recommend')}>
            <Text className="mt-4 text-sm text-gray-400">返回推荐</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        showsVerticalScrollIndicator={false}>
        <View className="pb-2 pt-2">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.back()}
            className="-ml-2 h-10 w-10 items-center justify-center">
            <ArrowLeft size={22} color="#000000" />
          </TouchableOpacity>
        </View>

        <RecipeHeader title={recipe.title} cookingTime={recipe.cookingTime} tags={recipe.tags} />

        <View className="gap-5">
          <IngredientList
            mainIngredients={recipe.mainIngredients}
            seasonings={recipe.seasonings}
            availableNames={availableNames}
          />
          <StepList steps={recipe.steps} highlightKeywords={highlightKeywords} />
          {recipe.tips ? <TipsCard tips={recipe.tips} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
