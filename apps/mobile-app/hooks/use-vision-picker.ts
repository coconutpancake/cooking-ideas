import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { recognizeIngredients } from '@/src/api/client';

const PICKER_IMAGE_QUALITY = 0.2;
const MAX_IMAGE_WIDTH = 1024;

async function launchLibrary() {
  console.log('>>> [VisionPicker] 准备请求相册权限');
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  console.log('>>> [VisionPicker] 相册权限结果', { granted: permission.granted });

  if (!permission.granted) {
    throw new Error('需要相册权限才能选择冰箱照片');
  }

  console.log('>>> [VisionPicker] 准备打开相册，base64=true quality=0.2');
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    base64: true,
    quality: PICKER_IMAGE_QUALITY,
  });
}

async function launchCamera() {
  console.log('>>> [VisionPicker] 准备请求相机权限');
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  console.log('>>> [VisionPicker] 相机权限结果', { granted: permission.granted });

  if (!permission.granted) {
    throw new Error('需要相机权限才能拍照识别食材');
  }

  console.log('>>> [VisionPicker] 准备打开相机，base64=true quality=0.2');
  return ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    base64: true,
    quality: PICKER_IMAGE_QUALITY,
  });
}

async function toCompressedDataUrl(asset: ImagePicker.ImagePickerAsset) {
  const resizeAction =
    asset.width && asset.width > MAX_IMAGE_WIDTH
      ? [{ resize: { width: MAX_IMAGE_WIDTH } }]
      : [];

  console.log('>>> [VisionPicker] 选中图片', {
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType,
    uri: asset.uri,
    pickerBase64Length: asset.base64?.length ?? 0,
  });

  const compressed = await ImageManipulator.manipulateAsync(asset.uri, resizeAction, {
    compress: PICKER_IMAGE_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!compressed.base64) {
    throw new Error('图片压缩失败，请重新选择');
  }

  console.log('>>> [VisionPicker] 图片压缩完成', {
    width: compressed.width,
    height: compressed.height,
    base64Length: compressed.base64.length,
    approxPayloadKB: Math.round((compressed.base64.length * 3) / 4 / 1024),
  });

  return `data:image/jpeg;base64,${compressed.base64}`;
}

export function useVisionPicker() {
  const [isRecognizing, setIsRecognizing] = useState(false);

  const recognizeFromSource = useCallback(async (source: 'camera' | 'library') => {
    console.log('>>> [VisionPicker] recognizeFromSource 进入', { source });
    setIsRecognizing(true);

    try {
      const result = source === 'camera' ? await launchCamera() : await launchLibrary();

      console.log('>>> [VisionPicker] ImagePicker 返回', {
        source,
        canceled: result.canceled,
        assetsCount: result.assets?.length ?? 0,
      });

      if (result.canceled || !result.assets[0]) {
        console.log('>>> [VisionPicker] 用户取消或没有拿到图片');
        return [];
      }

      const image = await toCompressedDataUrl(result.assets[0]);

      console.log('>>> [VisionPicker] 开始发送 /api/vision fetch 前', {
        dataUrlLength: image.length,
      });

      const response = await recognizeIngredients(image);
      const names = response.data.ingredients.map((item) => item.name).filter(Boolean);

      console.log('>>> [VisionPicker] /api/vision 请求成功', {
        imageId: response.data.imageId,
        ingredientCount: names.length,
        names,
      });

      return names;
    } catch (error) {
      console.log('>>> [VisionPicker] /api/vision 或图片处理捕获错误', {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      console.log('>>> [VisionPicker] recognizeFromSource 结束', { source });
      setIsRecognizing(false);
    }
  }, []);

  const pickAndRecognize = useCallback(() => {
    console.log('>>> [VisionPicker] pickAndRecognize 调用', { platform: Platform.OS });

    if (Platform.OS === 'web') {
      return recognizeFromSource('library');
    }

    return new Promise<string[]>((resolve, reject) => {
      Alert.alert('更新冰箱', '选择食材识别方式', [
        {
          text: '拍照',
          onPress: () => {
            console.log('>>> [VisionPicker] 用户选择：拍照');
            recognizeFromSource('camera').then(resolve).catch(reject);
          },
        },
        {
          text: '从相册选择',
          onPress: () => {
            console.log('>>> [VisionPicker] 用户选择：从相册选择');
            recognizeFromSource('library').then(resolve).catch(reject);
          },
        },
        {
          text: '取消',
          style: 'cancel',
          onPress: () => {
            console.log('>>> [VisionPicker] 用户取消来源选择');
            resolve([]);
          },
        },
      ]);
    });
  }, [recognizeFromSource]);

  return {
    isRecognizing,
    pickAndRecognize,
  };
}
