import { router, type Href } from 'expo-router';
import { Camera, CheckCircle2, Plus, Snowflake, Star, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useIngredients } from '@/hooks/use-ingredients';
import { usePreferences } from '@/hooks/use-preferences';
import { useVisionPicker } from '@/hooks/use-vision-picker';
import {
  clearRecommendationsCache,
  hasSeenPinTooltip,
  markPinTooltipSeen,
} from '@/lib/storage';
import {
  categories,
  mealPreferenceOptions,
  type CategoryKey,
  type IngredientItem,
} from '@/lib/types';

export default function FridgeScreen() {
  const {
    ingredients,
    isLoading,
    isSaving,
    lastUpdated,
    add,
    addRecognizedIngredients,
    remove,
    togglePinned,
  } = useIngredients();
  const { mealPreference, updateMealPreference } = usePreferences();
  const { isRecognizing, pickAndRecognize } = useVisionPicker();
  const [showUploadTip, setShowUploadTip] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [showPinTip, setShowPinTip] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [manualIngredientName, setManualIngredientName] = useState('');
  const [isEditingIngredients, setIsEditingIngredients] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTooltipState() {
      const seen = await hasSeenPinTooltip();
      if (isMounted && !seen) {
        setShowPinTip(true);
      }
    }

    void loadTooltipState();

    return () => {
      isMounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map: Record<CategoryKey, IngredientItem[]> = { meat: [], vegetable: [], other: [] };
    ingredients.forEach((item) => map[item.category].push(item));
    return map;
  }, [ingredients]);

  const handleCameraUpdate = async () => {
    try {
      const recognizedNames = await pickAndRecognize();
      if (recognizedNames.length === 0) return;

      const addedNames = await addRecognizedIngredients(recognizedNames);
      setUploadMessage(
        addedNames.length > 0
          ? `已添加：${addedNames.join('、')}`
          : `已识别：${recognizedNames.join('、')}`,
      );
      setShowUploadTip(true);
      setTimeout(() => setShowUploadTip(false), 2500);
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : '未识别到清晰的食材，请重新拍摄或手动输入');
      setShowUploadTip(true);
      setTimeout(() => setShowUploadTip(false), 3000);
    }
  };

  const closePinTip = async () => {
    setShowPinTip(false);
    await markPinTooltipSeen();
  };

  const openManualIngredientModal = () => {
    setManualIngredientName('');
    setIsAddModalVisible(true);
  };

  const closeManualIngredientModal = () => {
    setIsAddModalVisible(false);
    setManualIngredientName('');
  };

  const confirmManualIngredient = async () => {
    const normalized = manualIngredientName.trim();
    if (!normalized) return;

    await add(normalized);
    closeManualIngredientModal();
  };

  const lastUpdatedText = lastUpdated ? '刚刚' : '暂无记录';
  const pinnedCount = ingredients.filter((item) => item.isPinned).length;

  const openInspiration = async () => {
    await clearRecommendationsCache();
    router.push({
      pathname: '/(tabs)/inspiration',
      params: { generate: String(Date.now()) },
    } as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8"
          showsVerticalScrollIndicator={false}>
          <View className="pb-4 pt-5">
            <Text className="text-2xl font-bold text-black">我的冰箱</Text>
            <Text className="mt-1 text-sm text-gray-400">食材越准确，推荐越合口味</Text>
          </View>

          <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Snowflake size={20} color="#9ca3af" />
              </View>
              <View>
                <Text className="text-sm font-medium text-black">上次更新</Text>
                <Text className="text-xs text-gray-400">{lastUpdatedText}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              disabled={isSaving || isRecognizing}
              onPress={handleCameraUpdate}
              className="flex-row items-center gap-1.5 rounded-full border border-gray-100 px-4 py-2">
              {isRecognizing ? (
                <ActivityIndicator color="#f97316" size="small" />
              ) : (
                <Camera size={16} color="#f97316" />
              )}
              <Text className="text-sm font-medium text-black">
                {isRecognizing ? '识别中' : '拍照更新'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPinTip ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={closePinTip}
              className="mb-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
              <Text className="text-sm font-semibold text-orange-700">
                点击星标，指定今天想吃的食材
              </Text>
              <Text className="mt-1 text-xs text-orange-500">标星食材会成为本次推荐的优先硬约束。</Text>
            </TouchableOpacity>
          ) : null}

          <View className="rounded-2xl border border-gray-100 bg-white p-4">
            <View className="mb-4 flex-row items-center justify-between py-2">
              <Text className="text-base font-semibold text-black">
                当前食材 <Text className="text-orange-500">{ingredients.length}</Text> 种
              </Text>
              <View className="flex-row items-center gap-3">
                {pinnedCount > 0 ? (
                  <Text className="text-xs font-medium text-orange-500">已标星 {pinnedCount} 种</Text>
                ) : null}
                {ingredients.length > 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setIsEditingIngredients((current) => !current)}
                    className="rounded-full bg-gray-100 px-3 py-1.5">
                    <Text className="text-xs font-semibold text-gray-600">
                      {isEditingIngredients ? '完成' : '编辑'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {isLoading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator color="#f97316" />
              </View>
            ) : ingredients.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-sm text-gray-400">冰箱里空空如也</Text>
                <Text className="mt-1 text-xs text-gray-300">点击上方按钮添加食材</Text>
                <TouchableOpacity
                  activeOpacity={0.75}
                  disabled={isSaving}
                  onPress={openManualIngredientModal}
                  className="mt-5 flex-row items-center justify-center gap-1.5 rounded-full bg-gray-100 px-4 py-2.5">
                  <Plus size={16} color="#3b82f6" />
                  <Text className="text-sm font-medium text-blue-500">手动添加食材</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-5">
                {categories.map((cat) => {
                  const items = grouped[cat.key];
                  if (items.length === 0) return null;

                  return (
                    <View key={cat.key}>
                      <Text className="mb-2 text-sm font-semibold text-gray-500">
                        {cat.label} ({items.length})
                      </Text>
                      <View className="flex-row flex-wrap gap-3">
                        {items.map((item) => (
                          <View
                            key={item.id}
                            className={
                              item.isPinned
                                ? 'flex-row items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5'
                                : 'flex-row items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5'
                            }>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              disabled={isSaving}
                              onPress={() => void togglePinned(item.id)}
                              className="h-5 w-5 items-center justify-center">
                              <Star
                                size={14}
                                color={item.isPinned ? '#f97316' : '#9ca3af'}
                                fill={item.isPinned ? '#f97316' : 'transparent'}
                              />
                            </TouchableOpacity>
                            <Text
                              className={
                                item.isPinned
                                  ? 'text-sm font-semibold text-orange-700'
                                  : 'text-sm text-black'
                              }>
                              {item.name}
                            </Text>
                            {isEditingIngredients ? (
                              <TouchableOpacity
                                activeOpacity={0.8}
                                disabled={isSaving}
                                onPress={() => void remove(item.id)}
                                className="h-4 w-4 items-center justify-center rounded-full bg-white/70">
                                <X size={10} color="#6b7280" />
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.75}
                  disabled={isSaving}
                  onPress={openManualIngredientModal}
                  className="flex-row items-center justify-center gap-1.5 py-2.5">
                  <Plus size={16} color="#3b82f6" />
                  <Text className="text-sm font-medium text-blue-500">手动添加食材</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
            <Text className="mb-3 text-sm font-semibold text-black">本餐偏好</Text>
            <View className="flex-row flex-wrap gap-2">
              {mealPreferenceOptions.map((option) => {
                const selected = mealPreference === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.8}
                    onPress={() => void updateMealPreference(selected ? null : option.key)}
                    className={
                      selected
                        ? 'rounded-full bg-orange-500 px-4 py-2'
                        : 'rounded-full border border-gray-100 bg-gray-50 px-4 py-2'
                    }>
                    <Text className={selected ? 'text-sm font-semibold text-white' : 'text-sm text-gray-600'}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={ingredients.length === 0}
              onPress={() => void openInspiration()}
              className={
                ingredients.length === 0
                  ? 'flex-row items-center justify-center gap-2 rounded-2xl bg-gray-200 py-4'
                  : 'flex-row items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4'
              }>
              <CheckCircle2 size={20} color="#ffffff" />
              <Text className="text-base font-semibold text-white">解锁今日做饭灵感</Text>
            </TouchableOpacity>
            <Text className="mt-2 text-center text-xs text-gray-400">
              根据现有食材、标星食材和口味偏好生成推荐
            </Text>
          </View>

          {showUploadTip ? (
            <View className="mt-4 rounded-xl border border-orange-100 bg-orange-50 px-4 py-2.5">
              <Text className="text-sm font-medium text-orange-500">{uploadMessage}</Text>
            </View>
          ) : null}
        </ScrollView>

        <Modal
          transparent
          visible={isAddModalVisible}
          animationType="slide"
          onRequestClose={closeManualIngredientModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-end">
            <Pressable className="flex-1 bg-black/20" onPress={closeManualIngredientModal} />
            <SafeAreaView edges={['bottom']} className="bg-white">
              <View className="border-t border-gray-100 px-5 pb-4 pt-5">
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-black">手动添加食材</Text>
                  <TouchableOpacity activeOpacity={0.75} onPress={closeManualIngredientModal}>
                    <Text className="text-sm text-gray-400">取消</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  autoFocus
                  value={manualIngredientName}
                  onChangeText={setManualIngredientName}
                  placeholder="输入食材名称"
                  placeholderTextColor="#9ca3af"
                  returnKeyType="done"
                  onSubmitEditing={() => void confirmManualIngredient()}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-base text-black"
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isSaving || manualIngredientName.trim().length === 0}
                  onPress={() => void confirmManualIngredient()}
                  className="mt-4 items-center rounded-2xl bg-orange-500 py-4">
                  <Text className="text-base font-semibold text-white">
                    {isSaving ? '保存中' : '确定'}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
