import { Plus, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  defaultAvoidanceOptions,
  defaultGoalOptions,
  defaultTasteOptions,
  keepCurrentOrCustomOptions,
  mergeOptions,
} from '@/lib/preferences';
import { type UserPreferences } from '@/lib/types';

interface PreferenceEditorProps {
  initial?: UserPreferences | null;
  onChangeValidity?: (isValid: boolean) => void;
  onSubmit?: (preferences: Omit<UserPreferences, 'updatedAt'>) => void;
}

function ToggleChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className={
        selected
          ? 'rounded-full bg-orange-500 px-4 py-2'
          : 'rounded-full border border-gray-100 bg-white px-4 py-2'
      }>
      <Text className={selected ? 'text-sm font-semibold text-white' : 'text-sm text-gray-600'}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CustomInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  const add = () => {
    const normalized = value.trim();
    if (!normalized) return;
    onAdd(normalized);
    setValue('');
  };

  return (
    <View className="mt-3 flex-row items-center gap-2">
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        returnKeyType="done"
        onSubmitEditing={add}
        className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-black"
      />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={add}
        className="h-11 w-11 items-center justify-center rounded-full bg-gray-100">
        <Plus size={18} color="#f97316" />
      </TouchableOpacity>
    </View>
  );
}

export function PreferenceEditor({ initial, onChangeValidity, onSubmit }: PreferenceEditorProps) {
  const [goal, setGoal] = useState(() => keepCurrentOrCustomOptions([initial?.goal ?? ''])[0] ?? '');
  const [tastes, setTastes] = useState<string[]>(() => keepCurrentOrCustomOptions(initial?.tastes));
  const [avoidances, setAvoidances] = useState<string[]>(() =>
    keepCurrentOrCustomOptions(initial?.avoidances),
  );

  const goalOptions = useMemo(() => mergeOptions(defaultGoalOptions, goal ? [goal] : []), [goal]);
  const tasteOptions = useMemo(() => mergeOptions(defaultTasteOptions, tastes), [tastes]);
  const avoidanceOptions = useMemo(
    () => mergeOptions(defaultAvoidanceOptions, avoidances),
    [avoidances],
  );
  const isValid = Boolean(goal) && tastes.length > 0;

  useEffect(() => {
    onChangeValidity?.(isValid);
  }, [isValid, onChangeValidity]);

  const toggleListValue = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const submit = () => {
    if (!isValid) return;
    onSubmit?.({
      goal,
      tastes,
      avoidances,
      completedOnboarding: true,
    });
  };

  return (
    <View className="gap-6">
      <View>
        <Text className="mb-3 text-base font-semibold text-black">饮食目标</Text>
        <View className="flex-row flex-wrap gap-2">
          {goalOptions.map((item) => (
            <ToggleChip
              key={item}
              label={item}
              selected={goal === item}
              onPress={() => setGoal(item)}
            />
          ))}
        </View>
        <CustomInput placeholder="添加自定义目标" onAdd={setGoal} />
      </View>

      <View>
        <Text className="mb-3 text-base font-semibold text-black">口味偏好</Text>
        <View className="flex-row flex-wrap gap-2">
          {tasteOptions.map((item) => (
            <ToggleChip
              key={item}
              label={item}
              selected={tastes.includes(item)}
              onPress={() => toggleListValue(item, tastes, setTastes)}
            />
          ))}
        </View>
        <CustomInput
          placeholder="添加自定义口味"
          onAdd={(value) => setTastes((current) => Array.from(new Set([...current, value])))}
        />
      </View>

      <View>
        <Text className="mb-3 text-base font-semibold text-black">忌口与禁忌</Text>
        <View className="flex-row flex-wrap gap-2">
          {avoidanceOptions.map((item) => (
            <ToggleChip
              key={item}
              label={item}
              selected={avoidances.includes(item)}
              onPress={() => toggleListValue(item, avoidances, setAvoidances)}
            />
          ))}
        </View>
        <CustomInput
          placeholder="添加自定义忌口"
          onAdd={(value) => setAvoidances((current) => Array.from(new Set([...current, value])))}
        />
      </View>

      {avoidances.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {avoidances.map((item) => (
            <TouchableOpacity
              key={item}
              activeOpacity={0.8}
              onPress={() => setAvoidances((current) => current.filter((value) => value !== item))}
              className="flex-row items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5">
              <Text className="text-xs text-gray-600">{item}</Text>
              <X size={12} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {onSubmit ? (
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!isValid}
          onPress={submit}
          className={isValid ? 'rounded-2xl bg-orange-500 py-4' : 'rounded-2xl bg-gray-200 py-4'}>
          <Text className={isValid ? 'text-center font-semibold text-white' : 'text-center font-semibold text-gray-400'}>
            完成
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
