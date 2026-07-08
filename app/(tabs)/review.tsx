import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ResponsiveLayout, VoiceRecorder } from '@/components';
import { colors, spacing, fontSize } from '@/theme/tokens';

export default function ReviewScreen() {
  return (
    <ResponsiveLayout
      primary={
        <Card title="复盘" subtitle="Task 7：录音采集与 Whisper 转录">
          <VoiceRecorder />
        </Card>
      }
      secondary={
        <Card title="趋势（Desktop）" subtitle="仅宽屏出现">
          <Text style={styles.body}>
            Task 8-9 将在此呈现「成就 · 问题 · 情绪」结构化复盘与趋势。
          </Text>
          <View style={{ height: spacing.md }} />
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>情绪折线图占位</Text>
          </View>
        </Card>
      }
    />
  );
}

const styles = StyleSheet.create({
  body: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  placeholder: {
    height: 160,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  placeholderText: { color: colors.primary, fontSize: fontSize.sm },
});
