/**
 * MobileScheduleView
 *
 * 极简时间线列表：按时间块分组，每组一个 section header（色带 + 标签 + 完成度），
 * 组内任务卡片纵向排列。
 *
 * 适用：窄屏（width < 768）
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '@/theme/tokens';
import { TaskBlockCard } from './TaskBlockCard';
import { groupTasksByBlock } from '@/services/timeUtils';
import type { TaskBlock } from '@/services/parseNoteToBlocks';

interface MobileScheduleViewProps {
  tasks: TaskBlock[];
  onToggle: (id: string) => void;
  onPress?: (id: string) => void;
}

export function MobileScheduleView({
  tasks,
  onToggle,
  onPress,
}: MobileScheduleViewProps) {
  const groups = groupTasksByBlock(tasks);
  const totalDone = tasks.filter((t) => t.done).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 总进度条 */}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          今日任务 {totalDone} / {tasks.length}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${tasks.length > 0 ? (totalDone / tasks.length) * 100 : 0}%`,
              },
            ]}
          />
        </View>
      </View>

      {groups.map((group) => {
        const done = group.tasks.filter((t) => t.done).length;
        return (
          <View key={group.block} style={styles.section}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: group.accent }]} />
              <Text style={styles.sectionTitle}>{group.label}</Text>
              <Text style={styles.sectionCount}>
                {done} / {group.tasks.length}
              </Text>
            </View>

            {/* 任务卡片 */}
            {group.tasks.map((task) => (
              <TaskBlockCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onPress={onPress}
              />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  progressRow: {
    marginBottom: spacing.lg,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.success,
    borderRadius: 3,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
});
