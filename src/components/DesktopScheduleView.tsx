/**
 * DesktopScheduleView
 *
 * 纵向时间线：早 → 中 → 下午 → 晚 → 随时，从上到下排列。
 * 所有时段均单列纵向排列，保留时间顺序与同一时段内的输入顺序。
 *
 * 适用：宽屏（width >= 768）
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '@/theme/tokens';
import { TaskBlockCard } from './TaskBlockCard';
import { groupTasksByBlock } from '@/services/timeUtils';
import type { TaskBlock } from '@/services/parseNoteToBlocks';

interface DesktopScheduleViewProps {
  tasks: TaskBlock[];
  onToggle: (id: string) => void;
  onPress?: (id: string) => void;
}

export function DesktopScheduleView({
  tasks,
  onToggle,
  onPress,
}: DesktopScheduleViewProps) {
  const groups = groupTasksByBlock(tasks);
  const totalDone = tasks.filter((t) => t.done).length;

  return (
    <View style={styles.container}>
      {/* 顶部总览 */}
      <View style={styles.overview}>
        <Text style={styles.overviewTitle}>今日看板</Text>
        <Text style={styles.overviewStat}>
          {totalDone} / {tasks.length} 已完成
        </Text>
      </View>

      {groups.map((group) => {
        const done = group.tasks.filter((t) => t.done).length;
        return (
          <View key={group.block} style={styles.section}>
            {/* Section header：色带 + 标签 + 完成度 */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: group.accent }]} />
              <Text style={styles.sectionTitle}>{group.label}</Text>
              <Text style={styles.sectionCount}>
                {done} / {group.tasks.length}
              </Text>
            </View>

            {/* 任务卡片：PC 端也使用单列，避免同一时段任务左右分栏打乱阅读顺序 */}
            <View style={styles.list}>
              {group.tasks.map((task) => (
                <View key={task.id}>
                  <TaskBlockCard
                    task={task}
                    onToggle={onToggle}
                    onPress={onPress}
                  />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  overview: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  overviewTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  overviewStat: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
  },
  sectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  list: {
    gap: spacing.sm,
  },
});
