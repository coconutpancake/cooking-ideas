import { CheckCircle2, Circle } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import type { RecipeStep } from '@/lib/mock-data';

interface RecipeHeaderProps {
  title: string;
  cookingTime: number;
  tags: string[];
}

export function RecipeHeader({ title, cookingTime, tags }: RecipeHeaderProps) {
  return (
    <View className="pb-4">
      <Text className="text-2xl font-bold leading-tight text-black">{title}</Text>
      <Text className="mt-1 text-sm text-gray-400">
        {cookingTime}分钟 · {tags[0]} · {tags[1]}
      </Text>
    </View>
  );
}

interface IngredientListProps {
  mainIngredients: { name: string; amount: string }[];
  seasonings: { name: string; amount: string }[];
  availableNames: string[];
}

export function IngredientList({
  mainIngredients,
  seasonings,
  availableNames,
}: IngredientListProps) {
  const availableSet = new Set(availableNames);

  return (
    <View>
      <Text className="border-b border-gray-100 pb-3 text-lg font-bold text-black">食材清单</Text>

      <View className="py-3">
        <View className="mb-2 flex-row items-center gap-2">
          <View className="h-5 w-5 items-center justify-center rounded-full bg-orange-100">
            <View className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          </View>
          <Text className="text-sm font-semibold text-black">主食材</Text>
        </View>

        {mainIngredients.map((ing) => {
          const hasIt = availableSet.has(ing.name);

          return (
            <View
              key={ing.name}
              className="flex-row items-center justify-between border-b border-gray-100 py-2.5">
              <View className="flex-row items-center gap-2">
                {hasIt ? (
                  <CheckCircle2 size={16} color="#22c55e" />
                ) : (
                  <Circle size={16} color="#d1d5db" />
                )}
                <Text className={hasIt ? 'text-sm text-black' : 'text-sm text-gray-400'}>
                  {ing.name}
                </Text>
              </View>
              <Text className="text-sm text-gray-400">{ing.amount}</Text>
            </View>
          );
        })}
      </View>

      <View className="border-t border-gray-100 py-3">
        <View className="mb-2 flex-row items-center gap-2">
          <View className="h-5 w-5 items-center justify-center rounded-full bg-gray-100">
            <Circle size={12} color="#9ca3af" />
          </View>
          <Text className="text-sm font-semibold text-black">调料与辅料</Text>
        </View>

        {seasonings.map((ing) => (
          <View
            key={ing.name}
            className="flex-row items-center justify-between border-b border-gray-100 py-2.5">
            <Text className="text-sm text-gray-500">{ing.name}</Text>
            <Text className="text-sm text-gray-400">{ing.amount}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface StepListProps {
  steps: RecipeStep[];
  highlightKeywords: string[];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedStepText({
  text,
  keywords,
}: {
  text: string;
  keywords: string[];
}) {
  const uniqueKeywords = [...new Set(keywords.map((item) => item.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );

  if (uniqueKeywords.length === 0) {
    return <Text>{text}</Text>;
  }

  const matcher = new RegExp(`(${uniqueKeywords.map(escapeRegExp).join('|')})`, 'g');
  const parts = text.split(matcher).filter((part) => part.length > 0);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = uniqueKeywords.includes(part);
        return (
          <Text key={`${part}-${index}`} className={isMatch ? 'text-orange-500' : undefined}>
            {part}
          </Text>
        );
      })}
    </>
  );
}

export function StepList({ steps, highlightKeywords }: StepListProps) {
  return (
    <View>
      <Text className="border-b border-gray-100 pb-3 text-lg font-bold text-black">做法步骤</Text>
      <View className="gap-4 py-4">
        {steps.map((step) => (
          <View key={step.order} className="flex-row items-start gap-3">
            <View className="mt-0.5 h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100">
              <Text className="text-xs font-bold text-orange-500">{step.order}</Text>
            </View>
            <Text className="flex-1 pt-0.5 text-sm leading-6 text-black">
              <HighlightedStepText text={step.description} keywords={highlightKeywords} />
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface TipsCardProps {
  tips: string;
}

export function TipsCard({ tips }: TipsCardProps) {
  return (
    <View className="pb-6">
      <View className="rounded-xl bg-orange-50 p-4">
        <View className="flex-row items-start gap-2">
          <View className="mt-0.5 h-4 w-4 rounded-full bg-orange-500" />
          <View className="flex-1">
            <Text className="mb-1 text-sm font-semibold text-orange-700">小贴士</Text>
            <Text className="text-sm leading-6 text-gray-800">{tips}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function RetryButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mt-4 self-center rounded-full bg-orange-500 px-6 py-3">
      <Text className="text-sm font-medium text-white">返回推荐</Text>
    </TouchableOpacity>
  );
}
