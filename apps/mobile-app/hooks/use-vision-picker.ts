import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { recognizeIngredients } from '@/src/api/client';

const PICKER_IMAGE_QUALITY = 0.65;
const MAX_IMAGE_LONG_EDGE = 1600;
const MAX_DIRECT_IMAGE_BYTES = 1.6 * 1024 * 1024;
const MAX_DIRECT_IMAGE_LONG_EDGE = 1800;

function debugLog(message: string, details?: unknown) {
  if (!__DEV__) {
    return;
  }

  if (details === undefined) {
    console.log(message);
  } else {
    console.log(message, details);
  }
}

async function launchLibrary() {
  debugLog('>>> [VisionPicker] request media library permission');
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('需要相册权限才能选择冰箱照片');
  }

  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    base64: true,
    quality: PICKER_IMAGE_QUALITY,
  });
}

async function launchCamera() {
  debugLog('>>> [VisionPicker] request camera permission');
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error('需要相机权限才能拍照识别食材');
  }

  return ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    base64: true,
    quality: PICKER_IMAGE_QUALITY,
  });
}

function estimateBase64Bytes(base64: string) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

async function toCompressedDataUrl(asset: ImagePicker.ImagePickerAsset) {
  const longEdge = Math.max(asset.width || 0, asset.height || 0);
  const directBytes = asset.base64 ? estimateBase64Bytes(asset.base64) : 0;
  const directMimeType = asset.mimeType || 'image/jpeg';
  const canUseDirectMimeType = /^image\/(jpeg|jpg|png|webp)$/i.test(directMimeType);

  if (
    asset.base64 &&
    canUseDirectMimeType &&
    directBytes > 0 &&
    directBytes <= MAX_DIRECT_IMAGE_BYTES &&
    longEdge <= MAX_DIRECT_IMAGE_LONG_EDGE
  ) {
    debugLog('>>> [VisionPicker] use picker image without recompressing', {
      width: asset.width,
      height: asset.height,
      mimeType: asset.mimeType,
      approxPayloadKB: Math.round(directBytes / 1024),
    });

    return `data:${directMimeType};base64,${asset.base64}`;
  }

  const resizeAction =
    longEdge > MAX_IMAGE_LONG_EDGE
      ? [
          {
            resize:
              (asset.width || 0) >= (asset.height || 0)
                ? { width: MAX_IMAGE_LONG_EDGE }
                : { height: MAX_IMAGE_LONG_EDGE },
          },
        ]
      : [];

  debugLog('>>> [VisionPicker] selected image', {
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType,
  });

  const compressed = await ImageManipulator.manipulateAsync(asset.uri, resizeAction, {
    compress: PICKER_IMAGE_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!compressed.base64) {
    throw new Error('图片压缩失败，请重新选择');
  }

  debugLog('>>> [VisionPicker] image compressed', {
    width: compressed.width,
    height: compressed.height,
    approxPayloadKB: Math.round((compressed.base64.length * 3) / 4 / 1024),
  });

  return `data:image/jpeg;base64,${compressed.base64}`;
}

export function useVisionPicker() {
  const [isRecognizing, setIsRecognizing] = useState(false);

  const recognizeFromSource = useCallback(async (source: 'camera' | 'library') => {
    debugLog('>>> [VisionPicker] recognizeFromSource', { source });
    setIsRecognizing(true);

    try {
      const result = source === 'camera' ? await launchCamera() : await launchLibrary();

      if (result.canceled || !result.assets[0]) {
        debugLog('>>> [VisionPicker] user canceled or no asset');
        return [];
      }

      const image = await toCompressedDataUrl(result.assets[0]);
      const response = await recognizeIngredients(image);
      const names = response.data.ingredients.map((item) => item.name).filter(Boolean);

      debugLog('>>> [VisionPicker] recognition success', {
        imageId: response.data.imageId,
        ingredientCount: names.length,
      });

      return names;
    } catch (error) {
      debugLog('>>> [VisionPicker] recognition error', {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  const pickAndRecognize = useCallback(() => {
    debugLog('>>> [VisionPicker] pickAndRecognize', { platform: Platform.OS });

    if (Platform.OS === 'web') {
      return recognizeFromSource('library');
    }

    return new Promise<string[]>((resolve, reject) => {
      Alert.alert('更新冰箱', '选择食材识别方式', [
        {
          text: '拍照',
          onPress: () => {
            recognizeFromSource('camera').then(resolve).catch(reject);
          },
        },
        {
          text: '从相册选择',
          onPress: () => {
            recognizeFromSource('library').then(resolve).catch(reject);
          },
        },
        {
          text: '取消',
          style: 'cancel',
          onPress: () => resolve([]),
        },
      ]);
    });
  }, [recognizeFromSource]);

  return {
    isRecognizing,
    pickAndRecognize,
  };
}
