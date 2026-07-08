import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius, shadow } from '@/theme/tokens';
import type { TaskBlock as TaskBlockType, TimeBlock } from '@/services/parseNoteToBlocks';

interface TaskBlockCardProps {
  task: TaskBlockType;
  onToggle?: (id: string) => void;
  onPress?: (id: string) => void;
}

// 每个时间块对应的柔和色带
const BLOCK_ACCENT: Record<TimeBlock, string> = {
  morning: '#FDE68A',    // 暖黄
  noon: '#FCA5A5',       // 淡红
  afternoon: '#93C5FD',  // 浅蓝
  evening: '#C4B5FD',    // 紫罗兰
  exact: '#6EE7B7',      // 绿松
  anytime: '#E5E7EB',    // 中性灰
};

export function TaskBlockCard({ task, onToggle, onPress }: TaskBlockCardProps) {
  const accent = BLOCK_ACCENT[task.block];
  return (
    <Pressable
      onPress={() => onPress?.(task.id)}
      style={({ pressed }) => [
        styles.card,
        shadow.sm,
        pressed && { opacity: 0.9 },
      ]}
    >
      {/* 左侧色带 */}
      <View style={[styles.accent, { backgroundColor: accent }]} />

      {/* 时间标签 */}
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{task.timeLabel || '—'}</Text>
      </View>

      {/* 标题 */}
      <View style={styles.titleCol}>
        <Text
          style={[styles.title, task.done && styles.titleDone]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
      </View>

      {/* 完成按钮 */}
      <Pressable
        onPress={() => onToggle?.(task.id)}
        hitSlop={12}
        style={[styles.checkbox, task.done && styles.checkboxDone]}
      >
        {task.done && <Text style={styles.checkmark}>✓</Text>}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingRight: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  accent: { width: 4, alignSelf: 'stretch' },
  timeCol: {
    width: 68,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
  },
  timeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  titleCol: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  title: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  titleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: fontWeight.bold,
  },
});
