/**
 * DesktopScheduleView
 *
 * 纵向时间线：早 → 中 → 下午 → 晚 → 随时，从上到下排列。
 * 早上/中午/下午/随时：单列纵向，保留时间先后顺序。
 * 晚上：双列网格（任务通常较多，双列更紧凑）。
 *
 * 适用：宽屏（width >= 768）
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius, shadow } from '@/theme/tokens';
import { TaskBlockCard } from './TaskBlockCard';
import { groupTasksByBlock, BLOCK_ACCENT, BLOCK_LABEL } from '@/services/timeUtils';
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

            {/* 任务卡片：晚上用双列网格，其它时段单列保留时间先后顺序 */}
            <View style={group.block === 'evening' ? styles.grid : styles.list}>
              {group.tasks.map((task) => (
                <View
                  key={task.id}
                  style={group.block === 'evening' ? styles.gridItem : undefined}
                >
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
  // 单列列表：保留时间先后顺序
  list: {
    gap: spacing.sm,
  },
  // 双列网格（晚上任务通常较多，双列更紧凑）
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '48%',
  },
});
