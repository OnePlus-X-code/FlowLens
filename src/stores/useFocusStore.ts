import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { crossPlatformStorage } from './storage';

interface FocusState {
  currentTaskId: string | null;
  startedAt: number | null;
  _hasHydrated: boolean;

  startFocus: (taskId: string) => void;
  endFocus: () => void;
  setHydrated: (v: boolean) => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set) => ({
      currentTaskId: null,
      startedAt: null,
      _hasHydrated: false,

      startFocus: (taskId) => set({ currentTaskId: taskId, startedAt: Date.now() }),
      endFocus: () => set({ currentTaskId: null, startedAt: null }),
      setHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'flowlens-focus-store-v1',
      storage: createJSONStorage(() => crossPlatformStorage),
      partialize: (state) => ({
        currentTaskId: state.currentTaskId,
        startedAt: state.startedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      version: 1,
    },
  ),
);
