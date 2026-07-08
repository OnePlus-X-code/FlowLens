import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { crossPlatformStorage } from './storage';
import { generateReviewSummary } from '@/services/llmReviewService';
import {
  fetchReviews,
  saveReview,
  type ReviewCard,
} from '@/services/reviewSyncService';

export type ReviewStatus = 'idle' | 'generating' | 'ok' | 'error';

interface ReviewState {
  reviews: ReviewCard[];
  status: ReviewStatus;
  error: string | null;
  _hasHydrated: boolean;

  generateFromTranscript: (transcript: string) => Promise<ReviewCard | null>;
  syncReviews: () => Promise<void>;
  setHydrated: (v: boolean) => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],
      status: 'idle',
      error: null,
      _hasHydrated: false,

      generateFromTranscript: async (transcript) => {
        set({ status: 'generating', error: null });
        const generated = await generateReviewSummary(transcript);
        if (!generated.ok) {
          set({ status: 'error', error: generated.reason });
          return null;
        }

        const localReview: ReviewCard = {
          id: `local_${Date.now()}`,
          transcript,
          ...generated.data,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ reviews: [localReview, ...s.reviews], status: 'ok' }));

        const saved = await saveReview(transcript, generated.data);
        if (saved.ok && saved.data) {
          set((s) => ({
            reviews: [saved.data!, ...s.reviews.filter((r) => r.id !== localReview.id)],
          }));
          return saved.data;
        }
        if (!saved.ok) set({ error: saved.reason });
        return localReview;
      },

      syncReviews: async () => {
        const res = await fetchReviews();
        if (res.ok && res.data && res.data.length > 0) {
          set({ reviews: res.data });
        }
      },

      setHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'flowlens-review-store-v1',
      storage: createJSONStorage(() => crossPlatformStorage),
      partialize: (state) => ({ reviews: state.reviews }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        void state?.syncReviews();
      },
      version: 1,
    },
  ),
);
