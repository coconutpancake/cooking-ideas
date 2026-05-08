import { Link } from 'expo-router';
import { Camera, CheckCircle2, Plus, Snowflake, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
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
import { useVisionPicker } from '@/hooks/use-vision-picker';
import { categories, type CategoryKey, type IngredientItem } from '@/lib/mock-data';

export default function HomeScreen() {
  const {
    ingredients,
    isLoading,
    isSaving,
    lastUpdated,
    add,
    addRecognizedIngredients,
    remove,
  } = useIngredients();
  const { isRecognizing, pickAndRecognize } = useVisionPicker();
  const [showUploadTip, setShowUploadTip] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [manualIngredientName, setManualIngredientName] = useState('');

  const grouped = useMemo(() => {
    const map: Record<CategoryKey, IngredientItem[]> = { meat: [], vegetable: [], other: [] };
    ingredients.forEach((item) => map[item.category].push(item));
    return map;
  }, [ingredients]);

  const mockCameraUpdate = async () => {
    console.log('>>> [Home] 拍照更新按钮已点击');

    try {
      const recognizedNames = await pickAndRecognize();
      console.log('>>> [Home] 识别流程返回', { recognizedNames });

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
      console.log('>>> [Home] 识别流程捕获错误', {
        message: error instanceof Error ? error.message : String(error),
      });
      setUploadMessage(error instanceof Error ? error.message : '识别失败，请重试');
      setShowUploadTip(true);
      setTimeout(() => setShowUploadTip(false), 3000);
    }
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-36"
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
              onPress={mockCameraUpdate}
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

          <View className="rounded-2xl border border-gray-100 bg-white p-4">
            <View className="mb-4 flex-row items-center justify-between py-2">
              <Text className="text-base font-semibold text-black">
                当前食材 <Text className="text-orange-500">{ingredients.length}</Text> 种
              </Text>
            </View>

            {isLoading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator color="#f97316" />
              </View>
            ) : ingredients.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-sm text-gray-400">冰箱里空空如也</Text>
                <Text className="mt-1 text-xs text-gray-300">点击上方按钮添加食材</Text>
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
                            className="flex-row items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
                            <Text className="text-sm text-black">{item.name}</Text>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              disabled={isSaving}
                              onPress={() => void remove(item.id)}
                              className="h-4 w-4 items-center justify-center rounded-full bg-gray-200">
                              <X size={10} color="#6b7280" />
                            </TouchableOpacity>
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
        </ScrollView>

        <SafeAreaView
          edges={['bottom']}
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pt-4">
          <Link href="/recommend" asChild>
            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4">
              <CheckCircle2 size={20} color="#ffffff" />
              <Text className="text-base font-semibold text-white">解锁每日做饭灵感</Text>
            </TouchableOpacity>
          </Link>
          <Text className="mt-2 text-center text-xs text-gray-400">
            根据现有食材，推荐适合的菜谱
          </Text>

          {showUploadTip && (
            <View className="mt-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-2.5">
              <Text className="text-sm font-medium text-orange-500">{uploadMessage}</Text>
            </View>
          )}
        </SafeAreaView>

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
