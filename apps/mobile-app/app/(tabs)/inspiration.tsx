import { Link, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { CheckCircle2, ChefHat, ChevronRight, RefreshCw, Search } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRecommendations } from '@/hooks/use-recommendations';
import { getRecommendationsRefreshMarker } from '@/lib/storage';

const cookingMethods = ['全部', '炒', '煮', '蒸', '烤', '凉拌'];

function methodMatches(selectedMethod: string, cookingMethod: string) {
  if (selectedMethod === '全部') return true;
  return cookingMethod.includes(selectedMethod);
}

export default function InspirationScreen() {
  const { generate } = useLocalSearchParams<{ generate?: string }>();
  const {
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
  } = useRecommendations();
  const [selectedMethod, setSelectedMethod] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const handledGenerateRef = useRef<string | null>(null);
  const lastRefreshMarkerRef = useRef<number | null>(null);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    if (!generate || handledGenerateRef.current === generate) {
      return;
    }

    handledGenerateRef.current = generate;
    void loadRecommendations({ force: true });
  }, [generate, loadRecommendations]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshIfPreferencesChanged = async () => {
        const marker = await getRecommendationsRefreshMarker();

        if (!isActive) return;

        if (lastRefreshMarkerRef.current === null) {
          lastRefreshMarkerRef.current = marker;
          return;
        }

        if (marker !== lastRefreshMarkerRef.current) {
          lastRefreshMarkerRef.current = marker;
          await loadRecommendations({ force: true });
        }
      };

      void refreshIfPreferencesChanged();

      return () => {
        isActive = false;
      };
    }, [loadRecommendations]),
  );

  const filteredRecommendations = useMemo(() => {
    const keyword = searchQuery.trim();
    return recommendations.filter((recipe) => {
      const matchSearch = !keyword || recipe.title.includes(keyword);
      const matchMethod = methodMatches(selectedMethod, recipe.cookingMethod);
      return matchSearch && matchMethod;
    });
  }, [recommendations, searchQuery, selectedMethod]);

  const subtitle = pinnedIngredients.length > 0
    ? `优先使用「${pinnedIngredients.slice(0, 3).join('、')}」`
    : userIngredients.length > 0
      ? `根据「${userIngredients.slice(0, 3).join('、')}」为你推荐`
      : '先去冰箱添加食材，再生成今日灵感';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}>
        <View className="pb-3 pt-6">
          <Text className="text-2xl font-bold text-black">今日灵感</Text>
          <Text className="mt-0.5 text-sm text-gray-400">{subtitle}</Text>
        </View>

        <View className="flex-row items-center gap-3 pb-4">
          <View className="flex-1 flex-row items-center gap-2.5 rounded-full bg-gray-100 px-4 py-3">
            <Search size={16} color="#9ca3af" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="搜索菜谱..."
              placeholderTextColor="#9ca3af"
              className="flex-1 p-0 text-sm text-black"
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={isRefreshing}
            onPress={() => void refreshRecommendations()}
            className="h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            {isRefreshing ? (
              <ActivityIndicator color="#f97316" />
            ) : (
              <RefreshCw size={18} color="#6b7280" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5"
          contentContainerClassName="gap-2.5 px-5 pb-4">
          {cookingMethods.map((method) => (
            <TouchableOpacity
              key={method}
              activeOpacity={0.8}
              onPress={() => setSelectedMethod(method)}
              className={
                selectedMethod === method
                  ? 'rounded-full bg-orange-500 px-4 py-1.5'
                  : 'rounded-full px-4 py-1.5'
              }>
              <Text
                className={
                  selectedMethod === method
                    ? 'text-sm font-medium text-white'
                    : 'text-sm font-medium text-gray-500'
                }>
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <View className="items-center justify-center py-28">
            <ActivityIndicator color="#f97316" size="large" />
            <Text className="mt-5 text-sm text-gray-400">根据食材生成灵感中...</Text>
          </View>
        ) : error && recommendations.length === 0 ? (
          <View className="items-center justify-center py-24">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-xl bg-gray-100">
              <ChefHat size={28} color="#9ca3af" opacity={0.5} />
            </View>
            <Text className="px-8 text-center text-sm text-gray-400">{error}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void refreshRecommendations()}
              className="mt-5 rounded-full bg-orange-500 px-5 py-3">
              <Text className="text-sm font-semibold text-white">重新生成</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRecommendations.length === 0 ? (
          <View className="items-center justify-center py-24">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-xl bg-gray-100">
              <ChefHat size={28} color="#9ca3af" opacity={0.5} />
            </View>
            <Text className="text-sm text-gray-400">暂无符合条件的推荐</Text>
          </View>
        ) : (
          <View>
            {filteredRecommendations.map((recipe) => {
              const matchPercent = Math.round(recipe.matchingScore * 100);

              return (
                <Link
                  key={recipe.recipeId}
                  href={{
                    pathname: '/recipe/[id]',
                    params: { id: recipe.recipeId },
                  }}
                  asChild>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between border-b border-gray-100 py-4">
                    <View className="flex-1 pr-4">
                      <Text className="text-base font-semibold leading-tight text-black">
                        {recipe.title}
                      </Text>

                      <View className="mt-1.5 flex-row items-center gap-1.5">
                        <Text className="text-xs font-medium text-orange-500">{matchPercent}%</Text>
                        <Text className="text-xs text-gray-300">·</Text>
                        <Text className="text-xs text-gray-400">{recipe.cookingTime}分钟</Text>
                        <Text className="text-xs text-gray-300">·</Text>
                        <Text className="text-xs text-gray-400">{recipe.cookingMethod}</Text>
                      </View>

                      <View className="mt-1 flex-row items-center gap-1.5">
                        {recipe.isAllAvailable ? (
                          <>
                            <CheckCircle2 size={12} color="#22c55e" />
                            <Text className="text-xs font-medium text-green-600">食材已备齐</Text>
                          </>
                        ) : (
                          <Text className="text-xs font-medium text-orange-500">
                            缺少：{recipe.missingMainIngredients.join('、')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={18} color="#d1d5db" />
                  </TouchableOpacity>
                </Link>
              );
            })}

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoadingMore}
              onPress={() => void loadMoreRecommendations()}
              className="mt-5 items-center rounded-2xl border border-orange-100 bg-orange-50 py-4">
              {isLoadingMore ? (
                <ActivityIndicator color="#f97316" />
              ) : (
                <Text className="text-sm font-semibold text-orange-600">加载更多灵感</Text>
              )}
            </TouchableOpacity>

            {error ? (
              <Text className="mt-3 text-center text-xs text-orange-500">{error}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
