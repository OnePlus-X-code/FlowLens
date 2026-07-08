/**
 * 云端同步服务（Task 4）
 *
 * 职责：
 *   - 本地 TaskBlock 与云端 tasks 表的双向映射
 *   - 拉取（fetchRemoteTasks）
 *   - 推送（upsertTasks / softDeleteTask）
 *   - 冲突策略：以 updated_at 较新的为准（Last-Write-Wins）
 *
 * 特点：
 *   - 未配置 Supabase 时所有方法安全 no-op，返回 { skipped: true }
 *   - 未登录（无 auth.user）时也 no-op，等 Task 4.x 接入登录后自动生效
 *   - 保持纯函数：不直接引用 store，由 store 层调度调用
 */
import { supabase, isSupabaseConfigured } from './supabase';
import type { TaskBlock, TimeBlock } from './parseNoteToBlocks';

/** 云端 tasks 表行结构（与 supabase/schema.sql 对齐） */
export interface RemoteTaskRow {
  id: string;
  user_id: string;
  title: string;
  block: TimeBlock;
  minutes: number | null;
  time_label: string;
  done: boolean;
  note_snapshot: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SyncResult<T = unknown> {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  data?: T;
}

/** 取当前登录用户 id；未登录返回 null */
async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** 云端行 → 本地 TaskBlock */
export function rowToBlock(row: RemoteTaskRow): TaskBlock {
  return {
    id: row.id,
    title: row.title,
    block: row.block,
    minutes: row.minutes,
    timeLabel: row.time_label,
    done: row.done,
  };
}

/** 本地 TaskBlock → 云端 upsert payload（不含 user_id / 时间戳，由服务端补） */
export function blockToRow(
  block: TaskBlock,
  userId: string,
  noteSnapshot: string | null = null,
): Omit<RemoteTaskRow, 'created_at' | 'updated_at'> {
  return {
    id: block.id,
    user_id: userId,
    title: block.title,
    block: block.block,
    minutes: block.minutes,
    time_label: block.timeLabel,
    done: block.done,
    note_snapshot: noteSnapshot,
    // 关键：upsert 时把 deleted_at 重置为 null，
    // 这样"先 softDeleteAll 再 upsert"的复活流程能正确清除软删除标记
    deleted_at: null,
  };
}

/** 拉取当前用户所有未删除任务，按 updated_at desc（返回带元数据的原始行） */
export async function fetchRemoteRows(): Promise<SyncResult<RemoteTaskRow[]>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: true, skipped: true, reason: 'supabase-not-configured' };
  }
  const uid = await currentUserId();
  if (!uid) return { ok: true, skipped: true, reason: 'not-signed-in' };

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) return { ok: false, reason: error.message };
  return { ok: true, data: (data ?? []) as RemoteTaskRow[] };
}

/** 拉取当前用户所有未删除任务，映射为本地 TaskBlock */
export async function fetchRemoteTasks(): Promise<SyncResult<TaskBlock[]>> {
  const res = await fetchRemoteRows();
  if (!res.ok) return { ok: false, reason: res.reason };
  if (res.skipped) return { ok: true, skipped: true, reason: res.reason };
  return { ok: true, data: (res.data ?? []).map(rowToBlock) };
}

/** 批量 upsert 任务 */
export async function upsertTasks(
  blocks: TaskBlock[],
  noteSnapshot: string | null = null,
): Promise<SyncResult<number>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: true, skipped: true, reason: 'supabase-not-configured' };
  }
  if (blocks.length === 0) return { ok: true, data: 0 };
  const uid = await currentUserId();
  if (!uid) return { ok: true, skipped: true, reason: 'not-signed-in' };

  const payload = blocks.map((b) => blockToRow(b, uid, noteSnapshot));
  const { error, count } = await supabase
    .from('tasks')
    .upsert(payload, { onConflict: 'id', count: 'exact' });

  if (error) return { ok: false, reason: error.message };
  return { ok: true, data: count ?? blocks.length };
}

/** 软删除单条 */
export async function softDeleteTask(id: string): Promise<SyncResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: true, skipped: true, reason: 'supabase-not-configured' };
  }
  const uid = await currentUserId();
  if (!uid) return { ok: true, skipped: true, reason: 'not-signed-in' };

  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', uid);

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/** 批量软删除（clearTasks 场景） */
export async function softDeleteAllTasks(): Promise<SyncResult<number>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: true, skipped: true, reason: 'supabase-not-configured' };
  }
  const uid = await currentUserId();
  if (!uid) return { ok: true, skipped: true, reason: 'not-signed-in' };

  const { error, count } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() }, { count: 'exact' })
    .eq('user_id', uid)
    .is('deleted_at', null);

  if (error) return { ok: false, reason: error.message };
  return { ok: true, data: count ?? 0 };
}

/**
 * 拉取 + 合并策略（Last-Write-Wins）：
 *   - 本地和云端各有一份任务列表
 *   - 相同 id 保留 updated_at 较新的（本地无 updated_at，用传入的 localTouchedAt 兜底）
 *   - 云端独有的补到本地
 *   - 本地独有的推到云端
 * 返回合并后的最终列表
 */
export async function mergeLWW(
  localBlocks: TaskBlock[],
  localTouchedAt: number,
): Promise<SyncResult<TaskBlock[]>> {
  const remote = await fetchRemoteRows();
  if (!remote.ok) return { ok: false, reason: remote.reason };
  if (remote.skipped) {
    return { ok: true, skipped: true, reason: remote.reason, data: localBlocks };
  }

  const remoteRows = remote.data ?? [];
  const remoteMap = new Map(remoteRows.map((r) => [r.id, r]));
  const localMap = new Map(localBlocks.map((l) => [l.id, l]));

  const merged: TaskBlock[] = [];
  const toPush: TaskBlock[] = [];

  // 遍历云端：云端存在的优先，若本地也有再按 LWW
  for (const r of remoteRows) {
    const l = localMap.get(r.id);
    if (!l) {
      merged.push(rowToBlock(r));
    } else {
      const remoteTs = Date.parse(r.updated_at) || 0;
      if (localTouchedAt > remoteTs) {
        merged.push(l);
        toPush.push(l);
      } else {
        merged.push(rowToBlock(r));
      }
    }
  }

  // 本地独有 → 补进结果并推送
  for (const l of localBlocks) {
    if (!remoteMap.has(l.id)) {
      merged.push(l);
      toPush.push(l);
    }
  }

  if (toPush.length > 0) {
    await upsertTasks(toPush);
  }

  return { ok: true, data: merged };
}
