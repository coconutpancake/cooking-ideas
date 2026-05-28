import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { configureSystemTextScaling } from '@/lib/text-scaling';
import 'react-native-reanimated';
import '../global.css';

configureSystemTextScaling();

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recommend" />
        <Stack.Screen name="recipe/[id]" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
