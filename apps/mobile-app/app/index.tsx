import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getUserPreferences } from '@/lib/storage';

export default function EntryScreen() {
  const [target, setTarget] = useState<'onboarding' | 'tabs' | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function resolveEntry() {
      const preferences = await getUserPreferences();
      if (isMounted) {
        setTarget(preferences?.completedOnboarding ? 'tabs' : 'onboarding');
      }
    }

    void resolveEntry();

    return () => {
      isMounted = false;
    };
  }, []);

  if (target === 'onboarding') {
    return <Redirect href={'/onboarding' as Href} />;
  }

  if (target === 'tabs') {
    return <Redirect href={'/(tabs)' as Href} />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator color="#f97316" />
    </View>
  );
}
