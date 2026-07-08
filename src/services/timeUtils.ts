/**
 * 时间块排序与分组工具
 *
 * - sortTasks: 按时间块顺序 + minutes 升序排列
 * - groupTasksByBlock: 按时间块分组，返回有序的 { block, label, accent, tasks } 数组
 * - BLOCK_ORDER: 时间块的显示顺序
 */
import type { TaskBlock, TimeBlock } from './parseNoteToBlocks';

/** 时间块显示顺序（exact 按 minutes 插入对应时段） */
export const BLOCK_ORDER: TimeBlock[] = [
  'morning',
  'noon',
  'afternoon',
  'evening',
  'anytime',
];

/** 每个块的中文标签 */
export const BLOCK_LABEL: Record<TimeBlock, string> = {
  morning: '早上',
  noon: '中午',
  afternoon: '下午',
  evening: '晚上',
  exact: '精确时间',
  anytime: '随时',
};

/** 每个块的柔和色带（与 TaskBlockCard 一致） */
export const BLOCK_ACCENT: Record<TimeBlock, string> = {
  morning: '#FDE68A',
  noon: '#FCA5A5',
  afternoon: '#93C5FD',
  evening: '#C4B5FD',
  exact: '#6EE7B7',
  anytime: '#E5E7EB',
};

/** 块排序权重（用于比较） */
const BLOCK_WEIGHT: Record<TimeBlock, number> = {
  morning: 0,
  noon: 1,
  afternoon: 2,
  evening: 3,
  exact: 4, // exact 会被归入对应时段，这里仅兜底
  anytime: 5,
};

/**
 * 排序任务列表：
 * 1. 先把 exact 类型的任务按 minutes 归入对应时段（早 ≤720, 中 720-839, 下午 840-1079, 晚 ≥1080）
 * 2. 按时段权重排序
 * 3. 同时段内按 minutes 升序（null 排最后）
 * 4. 同 minutes 内按 title 排序（稳定）
 */
export function sortTasks(tasks: TaskBlock[]): TaskBlock[] {
  const mapped = tasks.map((t) => ({
    task: t,
    effBlock: effectiveBlock(t),
    effMinutes: t.minutes ?? Number.MAX_SAFE_INTEGER,
  }));

  mapped.sort((a, b) => {
    if (a.effBlock !== b.effBlock) {
      return BLOCK_WEIGHT[a.effBlock] - BLOCK_WEIGHT[b.effBlock];
    }
    if (a.effMinutes !== b.effMinutes) {
      return a.effMinutes - b.effMinutes;
    }
    return a.task.title.localeCompare(b.task.title, 'zh');
  });

  return mapped.map((m) => m.task);
}

/**
 * 把 exact 类型的任务按 minutes 归入对应时段（仅用于排序/分组，不改原数据）。
 * 非 exact 类型原样返回。
 */
function effectiveBlock(t: TaskBlock): TimeBlock {
  if (t.block !== 'exact' || t.minutes == null) return t.block;
  const m = t.minutes;
  if (m < 720) return 'morning';       // 00:00 - 11:59 → 早上
  if (m < 840) return 'noon';          // 12:00 - 13:59 → 中午
  if (m < 1080) return 'afternoon';    // 14:00 - 17:59 → 下午
  return 'evening';                     // 18:00 - 23:59 → 晚上
}

export interface BlockGroup {
  block: TimeBlock;
  label: string;
  accent: string;
  tasks: TaskBlock[];
}

/**
 * 按时间块分组（排序后）。
 * - exact 任务被归入对应时段组（但仍保留自己的 timeLabel）
 * - 空时段不返回（不显示空组）
 */
export function groupTasksByBlock(tasks: TaskBlock[]): BlockGroup[] {
  const sorted = sortTasks(tasks);
  const groups: BlockGroup[] = [];

  for (const block of BLOCK_ORDER) {
    const groupTasks = sorted.filter((t) => effectiveBlock(t) === block);
    if (groupTasks.length > 0) {
      groups.push({
        block,
        label: BLOCK_LABEL[block],
        accent: BLOCK_ACCENT[block],
        tasks: groupTasks,
      });
    }
  }

  return groups;
}
