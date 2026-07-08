-- ============================================================
-- FlowLens (心流镜) Supabase 数据库结构
-- 执行方式：在 Supabase 项目的 SQL Editor 中整段粘贴执行
-- ============================================================

-- 启用 UUID 扩展
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- tasks 表：任务块（由备忘录解析生成，或用户手动增删）
-- ------------------------------------------------------------
create table if not exists public.tasks (
  id            text primary key,                    -- 客户端生成的 UUID，避免额外 roundtrip
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  block         text not null check (block in ('morning','noon','afternoon','evening','exact','anytime')),
  minutes       integer,                             -- 精确时间：0-1439 的分钟数；无则为 NULL
  time_label    text not null,                       -- 展示用标签，如 "早上"、"14:30"
  done          boolean not null default false,
  note_snapshot text,                                -- 生成时来源备忘录快照（可空）
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz                          -- 软删除，用于跨端同步冲突处理
);

create index if not exists idx_tasks_user_updated on public.tasks(user_id, updated_at desc);
create index if not exists idx_tasks_user_alive   on public.tasks(user_id) where deleted_at is null;

-- ------------------------------------------------------------
-- reviews 表：复盘卡片（AI 生成的结构化复盘）
-- ------------------------------------------------------------
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  transcript    text not null,                       -- Whisper 转录出的原始文字
  achievements  jsonb not null default '[]'::jsonb,  -- 成就数组
  issues        jsonb not null default '[]'::jsonb,  -- 问题数组
  mood_label    text,                                -- 情绪标签，如 "平静"、"焦虑"
  mood_score    integer check (mood_score between 1 and 10),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_reviews_user_created on public.reviews(user_id, created_at desc);

-- ------------------------------------------------------------
-- updated_at 自动维护触发器
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tasks_touch on public.tasks;
create trigger trg_tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_reviews_touch on public.reviews;
create trigger trg_reviews_touch before update on public.reviews
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- Row Level Security：每个用户仅能读写自己的数据
-- ------------------------------------------------------------
alter table public.tasks   enable row level security;
alter table public.reviews enable row level security;

-- tasks 策略
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

-- reviews 策略
drop policy if exists "reviews_select_own" on public.reviews;
create policy "reviews_select_own" on public.reviews
  for select using (auth.uid() = user_id);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete using (auth.uid() = user_id);
