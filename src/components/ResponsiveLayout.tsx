import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { colors, spacing } from '@/theme/tokens';

interface ResponsiveLayoutProps {
  /** 主内容（Mobile 独占；Desktop 左侧） */
  primary: React.ReactNode;
  /** 次要内容（仅 Desktop 显示于右侧） */
  secondary?: React.ReactNode;
  /** Desktop 下主/副宽度比例，默认 1:1 */
  primaryFlex?: number;
  secondaryFlex?: number;
  /** 是否让页面滚动，默认 true */
  scrollable?: boolean;
  style?: ViewStyle;
  maxWidth?: number;
}

/**
 * 跨端响应式容器
 * - Mobile / Tablet: 单栏纵向堆叠
 * - Desktop (>=1024): 主 + 副 两栏并排；secondary 缺省则退化为单栏居中
 */
export function ResponsiveLayout({
  primary,
  secondary,
  primaryFlex = 1,
  secondaryFlex = 1,
  scrollable = true,
  style,
  maxWidth = 1280,
}: ResponsiveLayoutProps) {
  const { isDesktop } = useBreakpoint();
  const showSplit = isDesktop && !!secondary;

  const inner = (
    <View
      style={[
        styles.inner,
        showSplit ? styles.innerRow : styles.innerCol,
        { maxWidth },
        style,
      ]}
    >
      <View style={[styles.pane, { flex: primaryFlex }]}>{primary}</View>
      {showSplit && (
        <View style={[styles.pane, { flex: secondaryFlex }]}>{secondary}</View>
      )}
    </View>
  );

  if (!scrollable) {
    return <View style={styles.root}>{inner}</View>;
  }
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { alignItems: 'center', padding: spacing.lg },
  inner: { width: '100%', gap: spacing.lg },
  innerCol: { flexDirection: 'column' },
  innerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  pane: { minWidth: 0 },
});
