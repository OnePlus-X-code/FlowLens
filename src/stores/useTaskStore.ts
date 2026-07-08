import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { crossPlatformStorage } from './storage';
import { parseNoteToBlocks, TaskBlock } from '@/services/parseNoteToBlocks';
import {
  upsertTasks,
  softDeleteTask,
  softDeleteAllTasks,
  mergeLWW,
  type SyncResult,
} from '@/services/syncService';
import { isSupabaseConfigured } from '@/services/supabase';

/**
 * 任务与备忘录 Store
 * - note: 当前编辑中的备忘录（title + body）
 * - tasks: 通过备忘录生成的任务块列表
 * - 完全持久化到本地存储，刷新/重启后自动恢复
 * - 若配置了 Supabase，则所有变更 fire-and-forget 推送到云端；启动时自动 LWW 合并
 */

export interface NoteDraft {
  title: string;
  body: string;
}

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'ok'
  | 'error'
  | 'skipped';

interface TaskState {
  note: NoteDraft;
  tasks: TaskBlock[];
  /** 上次生成任务的时间戳（毫秒），未生成为 null */
  lastGeneratedAt: number | null;
  /** 持久化完成状态（rehydrate 后自动置 true） */
  _hasHydrated: boolean;

  // ── 云同步状态 ────────────────────────
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  lastSyncError: string | null;

  // ── Note ─────────────────────────────
  setNote: (patch: Partial<NoteDraft>) => void;
  clearNote: () => void;

  // ── Tasks ────────────────────────────
  /** 用当前 note 生成任务块，替换 tasks */
  generateTasksFromNote: () => TaskBlock[];
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearTasks: () => void;
  /** 直接覆盖任务列表（预留给同步/编辑场景） */
  setTasks: (tasks: TaskBlock[]) => void;

  // ── Meta ─────────────────────────────
  setHydrated: (v: boolean) => void;
  /** 清空全部（重置初始态） */
  resetAll: () => void;

  // ── Sync ─────────────────────────────
  /** 主动触发一次云端同步（拉取 + LWW 合并 + 补推） */
  syncNow: () => Promise<SyncResult>;
}

const initialNote: NoteDraft = { title: '', body: '' };

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      note: initialNote,
      tasks: [],
      lastGeneratedAt: null,
      _hasHydrated: false,
      syncStatus: 'idle',
      lastSyncedAt: null,
      lastSyncError: null,

      setNote: (patch) => set((s) => ({ note: { ...s.note, ...patch } })),
      clearNote: () => set({ note: initialNote }),

      generateTasksFromNote: () => {
        const { note } = get();
        const combined = [note.title, note.body].filter(Boolean).join('\n');
        const blocks = parseNoteToBlocks(combined);
        set({ tasks: blocks, lastGeneratedAt: Date.now() });
        // 先清空云端旧任务（可能 id 已变），再推送新任务
        void softDeleteAllTasks().then(() =>
          upsertTasks(blocks, combined).then((r) => applySyncResult(set, r)),
        );
        return blocks;
      },

      toggleTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        }));
        const changed = get().tasks.find((t) => t.id === id);
        if (changed) {
          void upsertTasks([changed]).then((r) => applySyncResult(set, r));
        }
      },

      removeTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        void softDeleteTask(id).then((r) => applySyncResult(set, r));
      },

      clearTasks: () => {
        set({ tasks: [], lastGeneratedAt: null });
        void softDeleteAllTasks().then((r) => applySyncResult(set, r));
      },

      setTasks: (tasks) => set({ tasks }),

      setHydrated: (v) => set({ _hasHydrated: v }),

      resetAll: () =>
        set({
          note: initialNote,
          tasks: [],
          lastGeneratedAt: null,
        }),

      syncNow: async () => {
        if (!isSupabaseConfigured()) {
          const r: SyncResult = { ok: true, skipped: true, reason: 'supabase-not-configured' };
          applySyncResult(set, r);
          return r;
        }
        set({ syncStatus: 'syncing', lastSyncError: null });
        const touched = get().lastGeneratedAt ?? 0;
        const res = await mergeLWW(get().tasks, touched);
        if (res.ok && res.data) {
          set({ tasks: res.data });
        }
        applySyncResult(set, res);
        return res;
      },
    }),
    {
      name: 'flowlens-task-store-v1',
      storage: createJSONStorage(() => crossPlatformStorage),
      // 仅持久化数据字段，跳过内部标志与瞬时同步状态
      partialize: (state) => ({
        note: state.note,
        tasks: state.tasks,
        lastGeneratedAt: state.lastGeneratedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        // rehydrate 完成后自动触发一次云同步（未配置会立即 skip）
        if (isSupabaseConfigured()) {
          void state?.syncNow();
        }
      },
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        // v1 → v2：旧 id 格式 `blk_{timestamp}_{seq}` 已废弃，
        // 改为确定性 id `blk_{block}_{minutes}_{hash}`。
        // 丢弃旧任务，让用户重新生成（新 id 才能与云端正确去重）。
        if (version < 2 && persisted && typeof persisted === 'object') {
          const s = persisted as { tasks?: TaskBlock[]; note?: NoteDraft; lastGeneratedAt?: number | null };
          return {
            note: s.note ?? initialNote,
            tasks: [],
            lastGeneratedAt: null,
          };
        }
        return persisted;
      },
    },
  ),
);

/** 把 SyncResult 落到 store 的可视化状态字段上 */
function applySyncResult(
  set: (partial: Partial<TaskState>) => void,
  r: SyncResult,
) {
  if (!r.ok) {
    set({ syncStatus: 'error', lastSyncError: r.reason ?? 'unknown' });
  } else if (r.skipped) {
    set({ syncStatus: 'skipped', lastSyncError: null });
  } else {
    set({ syncStatus: 'ok', lastSyncedAt: Date.now(), lastSyncError: null });
  }
}
