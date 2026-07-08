import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ResponsiveLayout } from '@/components';
import { colors, spacing, fontSize } from '@/theme/tokens';

export default function ReviewScreen() {
  return (
    <ResponsiveLayout
      primary={
        <Card title="复盘" subtitle="Task 7-8 将在此接入录音与 LLM 生成三段式复盘">
          <Text style={styles.body}>
            当前占位。后续将呈现「成就 · 问题 · 情绪」结构化卡片。
          </Text>
        </Card>
      }
      secondary={
        <Card title="趋势（Desktop）" subtitle="仅宽屏出现">
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
