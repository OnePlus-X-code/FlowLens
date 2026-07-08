/**
 * 自然语言时间块解析器 v2
 *
 * 把"备忘录式"文本切分为任务块 TaskBlock[]。
 *
 * 支持两种写法（可混用）：
 *
 * ▶ 写法 A：节标题模式（用户最常用）
 *     上午
 *       - 读论文
 *       - 回邮件
 *     下午
 *       - 撰写周报
 *
 *   规则：**如果某一行内容只包含时间关键词**（去掉项目符号/标点/空白后），
 *         则它作为"当前时段"，其后所有子任务都归入这个时段，直到遇到下一个时段行。
 *
 * ▶ 写法 B：时段 + 任务同行
 *     早上 写周报
 *     10:30 和产品对齐
 *     下午 code review
 *
 * ▶ 精确时间总是被识别（同行）：`9:00` / `14:30` / `下午2点` / `晚上8点半` / `10点`
 *
 * 未识别到时段的任务会归入 "anytime"（随时）。
 */

export type TimeBlock =
  | 'morning'
  | 'noon'
  | 'afternoon'
  | 'evening'
  | 'exact'
  | 'anytime';

export interface TaskBlock {
  id: string;
  title: string;
  block: TimeBlock;
  /** 精确时间（分钟数，从 00:00 起算），无则为 null */
  minutes: number | null;
  /** 展示用时间标签 */
  timeLabel: string;
  done: boolean;
}

const BLOCK_LABEL: Record<TimeBlock, string> = {
  morning: '早上',
  noon: '中午',
  afternoon: '下午',
  evening: '晚上',
  exact: '',
  anytime: '随时',
};

const BLOCK_ORDER_MINUTES: Record<TimeBlock, number> = {
  morning: 7 * 60,
  noon: 12 * 60,
  afternoon: 14 * 60,
  evening: 20 * 60,
  exact: 0,
  anytime: 24 * 60,
};

// 时段关键词表 —— 顺序即优先级
const BLOCK_KEYWORDS: Array<[RegExp, TimeBlock]> = [
  [/(早上|清晨|早晨|上午|一早|早)/, 'morning'],
  [/(中午|午间)/, 'noon'],
  [/(下午|午后)/, 'afternoon'],
  [/(晚上|傍晚|夜里|夜晚|今晚|晚)/, 'evening'],
];

// 精确时间正则
const RE_HHMM = /(\d{1,2})[:：](\d{2})/;
const RE_AM = /(上午|早上|清晨)\s*(\d{1,2})\s*(?:点|时)(半)?/;
const RE_PM = /(下午|午后)\s*(\d{1,2})\s*(?:点|时)(半)?/;
const RE_EVE = /(晚上|傍晚|今晚)\s*(\d{1,2})\s*(?:点|时)(半)?/;
const RE_ONLY_HOUR = /(?:^|\s)(\d{1,2})\s*(?:点|时)(半)?/;

function parseExactTime(line: string): { minutes: number; matched: string } | null {
  {
    const m = line.match(RE_HHMM);
    if (m) {
      const h = Math.min(23, parseInt(m[1], 10));
      const mm = Math.min(59, parseInt(m[2], 10));
      return { minutes: h * 60 + mm, matched: m[0] };
    }
  }
  const trials: Array<[RegExp, boolean]> = [
    [RE_AM, false],
    [RE_PM, true],
    [RE_EVE, true],
  ];
  for (const [re, needPmShift] of trials) {
    const m = line.match(re);
    if (m) {
      let h = parseInt(m[2], 10);
      const half = !!m[3];
      if (needPmShift && h >= 1 && h <= 11) h += 12;
      return { minutes: h * 60 + (half ? 30 : 0), matched: m[0] };
    }
  }
  {
    const m = line.match(RE_ONLY_HOUR);
    if (m) {
      const h = Math.min(23, parseInt(m[1], 10));
      const half = !!m[2];
      return { minutes: h * 60 + (half ? 30 : 0), matched: m[0] };
    }
  }
  return null;
}

function detectBlock(line: string): { block: TimeBlock; matched: string } | null {
  for (const [re, block] of BLOCK_KEYWORDS) {
    const m = line.match(re);
    if (m) return { block, matched: m[0] };
  }
  return null;
}

// 去除项目符号、序号
function stripBullet(text: string): string {
  return text.replace(/^\s*(?:[-*·•●▪]|\d+[.、)）])\s*/g, '');
}

function cleanTitle(text: string): string {
  return stripBullet(text).replace(/\s+/g, ' ').trim();
}

/**
 * 判断一行是否"纯时段行"：
 * 去掉项目符号/标点/空白后，剩下的内容只有时段关键词（morning/noon/afternoon/evening），
 * 且不含精确时间。
 */
function isPureSectionHeader(rawLine: string): TimeBlock | null {
  // 若已包含精确时间，就不是纯时段行
  if (parseExactTime(rawLine)) return null;

  // 剥掉项目符号 + 常见分隔标点 + 空白
  const stripped = stripBullet(rawLine)
    .replace(/[：:、,，.。;；!！?？\-—~～\s]+/g, '');
  if (!stripped) return null;

  const bk = detectBlock(stripped);
  if (!bk) return null;
  // 剩余部分（挖掉时段关键词）必须为空，才算纯时段行
  const rest = stripped.replace(bk.matched, '');
  return rest.length === 0 ? bk.block : null;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 基于内容生成确定性 id：同一份备忘录在任何设备生成的 id 相同，
 * 这样 mergeLWW 按 id 匹配时能正确去重，不会因多端生成导致任务重复。
 *
 * 格式：blk_{block}_{minutes}_{titleHash}
 */
function deterministicId(title: string, block: TimeBlock, minutes: number | null): string {
  // 简单字符串 hash（djb2 变体），足够区分不同任务
  const src = `${block}_${minutes ?? 'null'}_${title}`;
  let hash = 5381;
  for (let i = 0; i < src.length; i++) {
    hash = ((hash << 5) + hash + src.charCodeAt(i)) & 0x7fffffff;
  }
  return `blk_${block}_${minutes ?? 'x'}_${hash.toString(36)}`;
}

/**
 * 解析入口
 */
export function parseNoteToBlocks(text: string): TaskBlock[] {
  if (!text || !text.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const blocks: TaskBlock[] = [];
  let currentSection: TimeBlock | null = null; // 节标题带来的默认时段

  for (const rawLine of lines) {
    // 1) 纯时段行 → 切换 currentSection，不产生任务
    const section = isPureSectionHeader(rawLine);
    if (section) {
      currentSection = section;
      continue;
    }

    // 2) 精确时间（HH:mm / 下午2点 / 晚上8点半 / 10点 …）
    const exact = parseExactTime(rawLine);
    if (exact) {
      const titleRaw = rawLine.replace(exact.matched, '').trim();
      const title = cleanTitle(titleRaw);
      if (!title) continue;
      blocks.push({
        id: deterministicId(title, 'exact', exact.minutes),
        title,
        block: 'exact',
        minutes: exact.minutes,
        timeLabel: formatMinutes(exact.minutes),
        done: false,
      });
      continue;
    }

    // 3) 时段关键词 + 任务同行（写法 B）
    const bk = detectBlock(rawLine);
    if (bk) {
      const titleRaw = rawLine.replace(bk.matched, '').trim();
      const title = cleanTitle(titleRaw);
      if (title) {
        blocks.push({
          id: deterministicId(title, bk.block, null),
          title,
          block: bk.block,
          minutes: null,
          timeLabel: BLOCK_LABEL[bk.block],
          done: false,
        });
        continue;
      }
      // 如果时段后没有其他文字，视为节标题
      currentSection = bk.block;
      continue;
    }

    // 4) 普通任务行：使用当前节的时段，否则 anytime
    const title = cleanTitle(rawLine);
    if (!title) continue;
    const useBlock: TimeBlock = currentSection ?? 'anytime';
    blocks.push({
      id: deterministicId(title, useBlock, null),
      title,
      block: useBlock,
      minutes: null,
      timeLabel: BLOCK_LABEL[useBlock],
      done: false,
    });
  }

  // 按时间排序
  blocks.sort((a, b) => {
    const am = a.block === 'exact' ? (a.minutes ?? 0) : BLOCK_ORDER_MINUTES[a.block];
    const bm = b.block === 'exact' ? (b.minutes ?? 0) : BLOCK_ORDER_MINUTES[b.block];
    return am - bm;
  });

  return blocks;
}
