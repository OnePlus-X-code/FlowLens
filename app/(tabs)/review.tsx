import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card, ResponsiveLayout, VoiceRecorder } from '@/components';
import { colors, spacing, fontSize, fontWeight } from '@/theme/tokens';
import { useReviewStore } from '@/stores';

export default function ReviewScreen() {
  const [transcript, setTranscript] = useState('');
  const reviews = useReviewStore((s) => s.reviews);
  const status = useReviewStore((s) => s.status);
  const error = useReviewStore((s) => s.error);
  const generateFromTranscript = useReviewStore((s) => s.generateFromTranscript);
  const latestReview = reviews[0] ?? null;

  const handleGenerate = () => {
    void generateFromTranscript(transcript);
  };

  return (
    <ResponsiveLayout
      primary={
        <Card title="复盘" subtitle="Task 8：AI 结构化复盘">
          <VoiceRecorder onTranscript={setTranscript} />

          {transcript.length > 0 && (
            <View style={styles.generateBlock}>
              <Button
                title={status === 'generating' ? '生成中…' : '生成复盘'}
                onPress={handleGenerate}
                loading={status === 'generating'}
                disabled={status === 'generating'}
              />
              {error && <Text style={styles.error}>{error}</Text>}
            </View>
          )}

          {latestReview && (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>结构化复盘</Text>
              <ReviewSection title="成就" items={latestReview.achievements} />
              <ReviewSection title="问题" items={latestReview.issues} />
              <View style={styles.moodRow}>
                <Text style={styles.sectionTitle}>情绪</Text>
                <Text style={styles.moodText}>
                  {latestReview.moodLabel} · {latestReview.moodScore}/10
                </Text>
              </View>
            </View>
          )}
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

function ReviewSection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length > 0 ? (
        items.map((item) => (
          <Text key={item} style={styles.item}>
            {item}
          </Text>
        ))
      ) : (
        <Text style={styles.empty}>暂无</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  generateBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  reviewTitle: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  section: { gap: spacing.xs },
  sectionTitle: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  item: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  empty: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  moodText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.danger,
  },
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
