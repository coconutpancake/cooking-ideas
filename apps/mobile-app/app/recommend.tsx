import { Redirect, type Href } from 'expo-router';

export default function LegacyRecommendRedirect() {
  return <Redirect href={'/(tabs)/inspiration' as Href} />;
}
