import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * 跨端持久化存储适配器
 * - Web: 使用浏览器 localStorage（同步 API 包装成 Promise）
 * - Native (iOS/Android): 使用 @react-native-async-storage/async-storage
 *
 * 统一实现 zustand 的 `StateStorage` 接口。
 */

// 惰性加载 AsyncStorage，避免 Web 端引入 native-only 依赖
let asyncStorageMod: any = null;
function getAsyncStorage() {
  if (!asyncStorageMod) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    asyncStorageMod = require('@react-native-async-storage/async-storage').default;
  }
  return asyncStorageMod;
}

const webStorage: StateStorage = {
  getItem: (name) => {
    try {
      const v = typeof window !== 'undefined' ? window.localStorage.getItem(name) : null;
      return v;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(name, value);
    } catch {
      /* ignore quota / private mode errors */
    }
  },
  removeItem: (name) => {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

const nativeStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return await getAsyncStorage().getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await getAsyncStorage().setItem(name, value);
    } catch {
      /* ignore */
    }
  },
  removeItem: async (name) => {
    try {
      await getAsyncStorage().removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const crossPlatformStorage: StateStorage =
  Platform.OS === 'web' ? webStorage : nativeStorage;
