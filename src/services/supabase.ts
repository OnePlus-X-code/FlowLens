/**
 * Supabase 客户端封装
 *
 * - 从环境变量读取 URL + anon key
 * - 未配置时导出 null，业务层通过 `isSupabaseConfigured()` 判断，走"离线本地模式"
 * - 使用 EXPO_PUBLIC_* 前缀让变量在 RN / Web 两端都能被 Expo 注入
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

if (url && anonKey) {
  _client = createClient(url, anonKey, {
    auth: {
      // 允许本地会话持久化，跨端存储由 supabase-js 自行处理
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = _client;

export function isSupabaseConfigured(): boolean {
  return _client !== null;
}

/** 供 UI 层展示的连接状态摘要 */
export function getSupabaseStatus(): {
  configured: boolean;
  url: string | null;
} {
  return {
    configured: isSupabaseConfigured(),
    url: url ?? null,
  };
}
