import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Button, Card, ResponsiveLayout } from '@/components';
import { colors, spacing, fontSize } from '@/theme/tokens';
import { useTaskStore, useAuthStore } from '@/stores';
import { getSupabaseStatus } from '@/services/supabase';

// 开发用测试账号（由 CLI 创建）
const DEV_EMAIL = 'dev@flowlens.local';
const DEV_PASSWORD = 'FlowLens2026!';

export default function SettingsScreen() {
  const { bp, width } = useBreakpoint();
  const supabase = getSupabaseStatus();
  const syncStatus = useTaskStore((s) => s.syncStatus);
  const lastSyncedAt = useTaskStore((s) => s.lastSyncedAt);
  const lastSyncError = useTaskStore((s) => s.lastSyncError);
  const syncNow = useTaskStore((s) => s.syncNow);

  const userId = useAuthStore((s) => s.userId);
  const userEmail = useAuthStore((s) => s.userEmail);
  const authLoading = useAuthStore((s) => s.loading);
  const authError = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signInWithPassword);
  const signOut = useAuthStore((s) => s.signOut);

  const [signingIn, setSigningIn] = useState(false);

  const statusLabel = supabase.configured
    ? statusText(syncStatus)
    : '未配置（本地模式）';

  const handleDevLogin = async () => {
    setSigningIn(true);
    const ok = await signIn(DEV_EMAIL, DEV_PASSWORD);
    setSigningIn(false);
    if (ok) {
      // 登录成功后立即触发一次同步
      void syncNow();
    } else {
      Alert.alert('登录失败', authError ?? '未知错误');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ResponsiveLayout
      primary={
        <>
          <Card title="设置">
            <View style={styles.list}>
              <Row label="当前断点" value={bp} />
              <Row label="视口宽度" value={`${Math.round(width)}px`} />
              <Row label="版本" value="FlowLens MVP v0.3 · Task 4 云同步" />
            </View>
          </Card>

          <View style={{ height: spacing.md }} />

          <Card title="账户">
            <View style={styles.list}>
              <Row
                label="登录状态"
                value={userId ? '已登录' : '未登录'}
              />
              <Row label="邮箱" value={userEmail ?? '—'} />
              {authError && <Row label="错误" value={authError} />}
            </View>

            <View style={{ height: spacing.md }} />

            {userId ? (
              <Button
                title="退出登录"
                onPress={handleSignOut}
                variant="secondary"
                loading={authLoading}
              />
            ) : (
              <Button
                title={signingIn ? '登录中…' : '开发模式一键登录'}
                onPress={handleDevLogin}
                variant="primary"
                loading={signingIn || authLoading}
              />
            )}
          </Card>

          <View style={{ height: spacing.md }} />

          <Card title="云同步">
            <View style={styles.list}>
              <Row
                label="Supabase"
                value={supabase.configured ? '已配置' : '未配置'}
              />
              <Row
                label="URL"
                value={supabase.url ? shorten(supabase.url) : '—'}
              />
              <Row label="同步状态" value={statusLabel} />
              <Row
                label="上次同步"
                value={lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : '—'}
              />
              {lastSyncError && (
                <Row label="最近错误" value={lastSyncError} />
              )}
            </View>

            <View style={{ height: spacing.md }} />

            <Button
              title={syncStatus === 'syncing' ? '同步中…' : '立即同步'}
              onPress={() => {
                void syncNow();
              }}
              disabled={syncStatus === 'syncing'}
              variant={supabase.configured ? 'primary' : 'secondary'}
            />

            {!supabase.configured && (
              <Text style={styles.hint}>
                提示：复制 .env.example 为 .env，并填入你的 Supabase URL 与 anon key，重启即可启用云同步。
              </Text>
            )}
          </Card>
        </>
      }
    />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function statusText(s: string): string {
  switch (s) {
    case 'idle':
      return '待机';
    case 'syncing':
      return '同步中…';
    case 'ok':
      return '✓ 已同步';
    case 'error':
      return '⚠ 同步失败';
    case 'skipped':
      return '已跳过（未登录或未配置）';
    default:
      return s;
  }
}

function shorten(url: string): string {
  if (url.length <= 40) return url;
  return url.slice(0, 24) + '…' + url.slice(-12);
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  label: { fontSize: fontSize.md, color: colors.textSecondary },
  value: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
