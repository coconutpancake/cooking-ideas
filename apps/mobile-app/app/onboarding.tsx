import { router, type Href } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PreferenceEditor } from '@/components/preference-editor';
import { saveUserPreferences } from '@/lib/storage';
import type { UserPreferences } from '@/lib/types';

export default function OnboardingScreen() {
  const complete = async (preferences: Omit<UserPreferences, 'updatedAt'>) => {
    await saveUserPreferences(preferences);
    router.replace('/(tabs)' as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-6"
        showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
            <Text className="text-2xl">🍳</Text>
          </View>
          <Text className="text-2xl font-bold text-black">先让我认识你的口味</Text>
          <Text className="mt-2 text-sm leading-6 text-gray-500">
            三个小选择，之后推荐会同时考虑你的冰箱、今天想吃什么，以及长期偏好。
          </Text>
        </View>

        <PreferenceEditor onSubmit={complete} />
      </ScrollView>
    </SafeAreaView>
  );
}
