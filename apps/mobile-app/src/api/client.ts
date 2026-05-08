import type { RecipeRecommendation, RecipeStep } from '@/lib/mock-data';
import Constants from 'expo-constants';

const PRODUCTION_API_BASE_URL = 'https://cooking-ideas.vercel.app';
const LOCAL_API_PORT = 3000;
const REQUEST_TIMEOUT = 30000;

interface ApiErrorResponse {
  success: false;
  error?: string;
}

export interface RecommendResponse {
  success: true;
  data: {
    recommendations: RecipeRecommendation[];
    totalCandidates: number;
  };
}

export interface DetailResponse {
  success: true;
  steps: RecipeStep[];
  tips?: string;
  fullText?: string;
}

export interface VisionIngredient {
  name: string;
  amount?: string;
}

export interface VisionResponse {
  success: true;
  data: {
    ingredients: VisionIngredient[];
    imageId: string;
    message: string;
  };
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '');
}

function getExpoHostName() {
  const hostUri = Constants.expoConfig?.hostUri;

  if (!hostUri) {
    return null;
  }

  const normalizedHostUri = /^[a-z][a-z\d+\-.]*:\/\//i.test(hostUri)
    ? hostUri
    : `http://${hostUri}`;

  try {
    const hostName = new URL(normalizedHostUri).hostname;
    return hostName && hostName !== 'localhost' && hostName !== '127.0.0.1' ? hostName : null;
  } catch {
    return null;
  }
}

function getLocalApiBaseUrl() {
  const hostName = getExpoHostName();
  return hostName ? `http://${hostName}:${LOCAL_API_PORT}` : null;
}

function getApiBaseUrls() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const candidates = [
    configuredUrl || null,
    __DEV__ ? getLocalApiBaseUrl() : null,
    PRODUCTION_API_BASE_URL,
  ];

  return Array.from(
    new Set(candidates.filter((url): url is string => Boolean(url)).map(normalizeBaseUrl)),
  );
}

function buildUrl(baseUrl: string, path: string) {
  return new URL(path.replace(/^\//, ''), `${baseUrl}/`).toString();
}

async function requestJson<T extends object>(path: string, body: unknown): Promise<T> {
  const payload = JSON.stringify(body);
  const baseUrls = getApiBaseUrls();
  let lastError: unknown;

  for (const baseUrl of baseUrls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const startedAt = Date.now();
    const url = buildUrl(baseUrl, path);

    console.log('>>> [ApiClient] 开始发送 fetch 请求', {
      path,
      url,
      payloadLength: payload.length,
      timeoutMs: REQUEST_TIMEOUT,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
        signal: controller.signal,
      });

      console.log('>>> [ApiClient] fetch 请求收到响应', {
        path,
        url,
        status: response.status,
        ok: response.ok,
        elapsedMs: Date.now() - startedAt,
      });

      const data = (await response.json()) as T | ApiErrorResponse;

      if (!response.ok) {
        throw new Error(
          'error' in data && data.error ? data.error : `请求失败: HTTP ${response.status}`,
        );
      }

      if ('success' in data && data.success === false) {
        throw new Error(data.error || '请求失败');
      }

      return data as T;
    } catch (error) {
      lastError = error;

      console.log('>>> [ApiClient] fetch 请求 catch 错误', {
        path,
        url,
        elapsedMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : String(error),
      });

      const isNetworkError =
        error instanceof TypeError && error.message.toLowerCase().includes('network');
      const isAbortError = error instanceof Error && error.name === 'AbortError';

      if (!isNetworkError && !isAbortError) {
        throw error instanceof Error ? error : new Error('请求失败');
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof Error && lastError.name === 'AbortError') {
    throw new Error('请求超时，请检查网络连接或本地 API 服务是否已启动');
  }

  throw new Error(
    `网络请求失败，已尝试 ${baseUrls.join(', ')}。如果正在用 Expo Go 调试，请先启动后端服务 npm run dev -- -H 0.0.0.0 -p 3000，或配置 EXPO_PUBLIC_API_BASE_URL。`,
  );
}

export async function fetchRecommendations(ingredients: string[]) {
  return requestJson<RecommendResponse>('/api/recommend', { ingredients });
}

export async function fetchRecipeDetail(params: {
  recipeName: string;
  mainIngredients: string[];
  availableIngredients: string[];
}) {
  return requestJson<DetailResponse>('/api/detail', params);
}

export async function recognizeIngredients(image: string) {
  console.log('>>> [ApiClient] recognizeIngredients 调用', {
    imageLength: image.length,
    imagePrefix: image.slice(0, 30),
  });

  return requestJson<VisionResponse>('/api/vision', { image });
}
