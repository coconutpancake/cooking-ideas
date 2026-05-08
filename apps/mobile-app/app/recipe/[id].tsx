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
import type { RecipeDetail } from '@/lib/mock-data';
import { fetchRecipeDetail } from '@/src/api/client';
import { getCachedRecipeRecommendation, getIngredients, getRecipeDetailCache, saveRecipeDetailCache } from '@/lib/storage';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [availableNames, setAvailableNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const mainIngredientNames = [
          ...recommendation.availableMainIngredients,
          ...recommendation.missingMainIngredients,
        ];
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
          mainIngredients: mainIngredientNames.map((name) => ({ name, amount: '适量' })),
          seasonings: recommendation.seasonings.map((name) => ({ name, amount: '适量' })),
          steps: response.steps,
          tips: response.tips || '',
        };

        if (!isMounted) return;
        setRecipe(nextRecipe);
        await saveRecipeDetailCache(nextRecipe);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : '获取菜谱详情失败');
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
  }, [id]);

  const highlightKeywords = useMemo(() => {
    if (!recipe) return [];
    return [
      ...recipe.mainIngredients.map((item) => item.name),
      ...recipe.seasonings.map((item) => item.name),
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
          <RetryButton onPress={() => router.replace('/recommend')} />
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
