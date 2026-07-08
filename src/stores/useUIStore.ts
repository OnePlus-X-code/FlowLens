import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { crossPlatformStorage } from './storage';

/**
 * 轻量 UI 状态：主题模式、上次访问的 Tab 等
 * （目前不含跨端主题切换，为后续迭代预留接口）
 */

export type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  themeMode: ThemeMode;
  lastTab: string; // 例如 'index' | 'review' | 'settings'
  _hasHydrated: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  setLastTab: (tab: string) => void;
  setHydrated: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      lastTab: 'index',
      _hasHydrated: false,

      setThemeMode: (mode) => set({ themeMode: mode }),
      setLastTab: (tab) => set({ lastTab: tab }),
      setHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'flowlens-ui-store-v1',
      storage: createJSONStorage(() => crossPlatformStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        lastTab: state.lastTab,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      version: 1,
    },
  ),
);
