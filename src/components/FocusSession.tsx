import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '@/theme/tokens';
import type { TaskBlock } from '@/services/parseNoteToBlocks';

interface FocusSessionProps {
  task: TaskBlock;
  startedAt: number;
  onComplete: () => void;
  onExit: () => void;
}

export function FocusSession({
  task,
  startedAt,
  onComplete,
  onExit,
}: FocusSessionProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedLabel = useMemo(() => {
    const totalSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    if (hours <= 0) return `${mm}:${ss}`;
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
  }, [now, startedAt]);

  return (
    <View style={styles.screen}>
      <View style={[styles.panel, shadow.md]}>
        <Text style={styles.label}>正在专注</Text>
        <Text style={styles.timeLabel}>{task.timeLabel}</Text>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.timer}>{elapsedLabel}</Text>

        <View style={styles.actions}>
          <Button title="完成任务" size="lg" onPress={onComplete} />
          <Button title="退出专注" size="lg" variant="secondary" onPress={onExit} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 520,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  panel: {
    width: '100%',
    maxWidth: 680,
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  timeLabel: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  title: {
    maxWidth: 560,
    textAlign: 'center',
    fontSize: fontSize.display,
    lineHeight: 38,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  timer: {
    marginTop: spacing.xxl,
    fontSize: 56,
    lineHeight: 64,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  actions: {
    marginTop: spacing.xxxl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
