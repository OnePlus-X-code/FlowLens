/**
 * 认证 Store
 *
 * - 持有当前 user 与 session
 * - signInWithPassword / signOut
 * - 启动时自动 restoreSession（supabase-js 默认行为）
 * - 未配置 Supabase 时所有方法安全 no-op
 */
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/services/supabase';

interface AuthState {
  /** 当前用户 id（未登录为 null） */
  userId: string | null;
  /** 当前用户 email（未登录为 null） */
  userEmail: string | null;
  /** 是否正在加载会话 */
  loading: boolean;
  /** 最近一次错误信息 */
  error: string | null;

  /** 初始化：从 supabase 恢复会话；订阅 onAuthStateChange */
  init: () => () => void;
  /** 用邮箱+密码登录 */
  signInWithPassword: (email: string, password: string) => Promise<boolean>;
  /** 登出 */
  signOut: () => Promise<void>;
  /** 内部：设置会话状态 */
  _setSession: (userId: string | null, email: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  userEmail: null,
  loading: false,
  error: null,

  init: () => {
    if (!isSupabaseConfigured() || !supabase) return () => {};

    // 立即拉取当前会话
    set({ loading: true });
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      set({
        userId: u?.id ?? null,
        userEmail: u?.email ?? null,
        loading: false,
      });
    });

    // 订阅后续变化
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      get()._setSession(u?.id ?? null, u?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  },

  signInWithPassword: async (email, password) => {
    if (!isSupabaseConfigured() || !supabase) {
      set({ error: 'Supabase 未配置' });
      return false;
    }
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ loading: false, error: error.message });
      return false;
    }
    set({
      userId: data.user?.id ?? null,
      userEmail: data.user?.email ?? null,
      loading: false,
      error: null,
    });
    return true;
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ userId: null, userEmail: null, error: null });
  },

  _setSession: (userId, userEmail) => set({ userId, userEmail, loading: false }),
}));
