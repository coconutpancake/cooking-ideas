import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Edit3,
  FileText,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
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

import { PreferenceEditor } from '@/components/preference-editor';
import { usePreferences } from '@/hooks/use-preferences';
import { markRecommendationsNeedRefresh } from '@/lib/storage';
import type { UserPreferences } from '@/lib/types';

const PRIVACY_POLICY_URL =
  'https://pcnb1m6o6o6k.feishu.cn/wiki/ByApwO2jsipsTikA882ctk78nwe?from=from_copylink';
const TERMS_OF_SERVICE_URL =
  'https://pcnb1m6o6o6k.feishu.cn/wiki/MwjXwFfyvixwTDkUwyJcLTranUd?from=from_copylink';

export default function ProfileScreen() {
  const {
    preferences,
    profile,
    isLoading,
    isSaving,
    updatePreferences,
    updateProfile,
  } = usePreferences();
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [draftNickname, setDraftNickname] = useState('');
  const [showSavedTip, setShowSavedTip] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '2.0.0';

  const showSaved = () => {
    setShowSavedTip(true);
    setTimeout(() => setShowSavedTip(false), 1800);
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0] || !profile) return;

    await updateProfile({
      nickname: profile.nickname,
      avatarUri: result.assets[0].uri,
    });
    showSaved();
  };

  const openNameModal = () => {
    setDraftNickname(profile?.nickname ?? '本地灵感大厨');
    setIsNameModalVisible(true);
  };

  const saveNickname = async () => {
    if (!profile) return;
    await updateProfile({
      nickname: draftNickname,
      avatarUri: profile.avatarUri,
    });
    setIsNameModalVisible(false);
    showSaved();
  };

  const savePreferences = async (next: Omit<UserPreferences, 'updatedAt'>) => {
    await updatePreferences(next);
    await markRecommendationsNeedRefresh();
    showSaved();
  };

  const openExternalLink = async (url: string) => {
    await Linking.openURL(url);
  };

  if (isLoading || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f97316" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-6"
        showsVerticalScrollIndicator={false}>
        <View className="mb-4 rounded-2xl border border-gray-100 bg-white p-4">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => void pickAvatar()}
              className="h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-orange-50">
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} className="h-full w-full" />
              ) : (
                <UserRound size={32} color="#f97316" />
              )}
              <View className="absolute bottom-1 right-1 h-7 w-7 items-center justify-center rounded-full bg-white">
                <Camera size={14} color="#f97316" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={openNameModal} className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold text-black">{profile.nickname}</Text>
                <Edit3 size={15} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-4 rounded-2xl border border-gray-100 bg-white p-4">
          <View className="mb-4">
            <Text className="text-base font-bold text-black">专属口味档案</Text>
            <Text className="mt-1 text-xs text-gray-400">保存后会影响下一次推荐</Text>
          </View>
          <PreferenceEditor initial={preferences} onSubmit={savePreferences} />
        </View>

        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => void openExternalLink(PRIVACY_POLICY_URL)}
            className="flex-row items-center justify-between border-b border-gray-100 py-3">
            <View className="flex-row items-center gap-3">
              <ShieldCheck size={18} color="#6b7280" />
              <Text className="text-sm text-black">隐私政策</Text>
            </View>
            <ChevronRight size={16} color="#d1d5db" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => void openExternalLink(TERMS_OF_SERVICE_URL)}
            className="flex-row items-center justify-between border-b border-gray-100 py-3">
            <View className="flex-row items-center gap-3">
              <FileText size={18} color="#6b7280" />
              <Text className="text-sm text-black">用户服务协议</Text>
            </View>
            <ChevronRight size={16} color="#d1d5db" />
          </TouchableOpacity>
          <View className="flex-row items-center justify-between py-3">
            <Text className="text-sm text-gray-500">当前版本</Text>
            <Text className="text-sm font-medium text-gray-500">V{appVersion}</Text>
          </View>
        </View>

      </ScrollView>

      {showSavedTip ? (
        <View className="absolute bottom-7 left-0 right-0 items-center">
          <View className="flex-row items-center gap-1.5 rounded-full border border-gray-100 bg-white/95 px-3 py-2 shadow-sm">
            <CheckCircle2 size={14} color="#6b7280" />
            <Text className="text-xs font-medium text-gray-600">保存成功</Text>
          </View>
        </View>
      ) : null}

      <Modal
        transparent
        visible={isNameModalVisible}
        animationType="slide"
        onRequestClose={() => setIsNameModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end">
          <Pressable className="flex-1 bg-black/20" onPress={() => setIsNameModalVisible(false)} />
          <SafeAreaView edges={['bottom']} className="bg-white">
            <View className="border-t border-gray-100 px-5 pb-4 pt-5">
              <Text className="mb-4 text-base font-semibold text-black">编辑昵称</Text>
              <TextInput
                autoFocus
                value={draftNickname}
                onChangeText={setDraftNickname}
                placeholder="输入昵称"
                placeholderTextColor="#9ca3af"
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-base text-black"
              />
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isSaving || draftNickname.trim().length === 0}
                onPress={() => void saveNickname()}
                className="mt-4 items-center rounded-2xl bg-orange-500 py-4">
                <Text className="text-base font-semibold text-white">
                  {isSaving ? '保存中' : '保存'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
