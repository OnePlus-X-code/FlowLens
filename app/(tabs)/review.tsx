import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card, ResponsiveLayout, VoiceRecorder } from '@/components';
import { colors, spacing, fontSize, fontWeight } from '@/theme/tokens';
import { useReviewStore } from '@/stores';
import type { ReviewCard } from '@/services/reviewSyncService';

export default function ReviewScreen() {
  const [transcript, setTranscript] = useState('');
  const reviews = useReviewStore((s) => s.reviews);
  const status = useReviewStore((s) => s.status);
  const error = useReviewStore((s) => s.error);
  const generateFromTranscript = useReviewStore((s) => s.generateFromTranscript);
  const latestReview = reviews[0] ?? null;
  const weekly = getWeeklyReport(reviews);

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

          {reviews.length > 1 && (
            <View style={styles.historyBlock}>
              <Text style={styles.reviewTitle}>历史复盘</Text>
              {reviews.slice(1, 5).map((review) => (
                <View key={review.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{formatDate(review.createdAt)}</Text>
                  <Text style={styles.historyText} numberOfLines={2}>
                    {review.achievements[0] ?? review.transcript}
                  </Text>
                  <Text style={styles.historyMood}>
                    {review.moodLabel} · {review.moodScore}/10
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      }
      secondary={
        <Card title="周报" subtitle="Desktop 趋势视图">
          <View style={styles.metricGrid}>
            <Metric label="本周复盘" value={`${weekly.count}`} />
            <Metric label="平均情绪" value={weekly.averageMood ? `${weekly.averageMood}/10` : '—'} />
            <Metric label="成就条目" value={`${weekly.achievementCount}`} />
          </View>

          <View style={styles.trendBlock}>
            <Text style={styles.reviewTitle}>情绪趋势</Text>
            {weekly.items.length > 0 ? (
              <View style={styles.trendBars}>
                {weekly.items.map((review) => (
                  <View key={review.id} style={styles.trendItem}>
                    <View style={styles.trendTrack}>
                      <View
                        style={[
                          styles.trendFill,
                          { height: `${Math.max(8, review.moodScore * 10)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.trendLabel}>{formatShortDate(review.createdAt)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>生成复盘后，这里会显示本周情绪走势。</Text>
            )}
          </View>

          <View style={styles.weeklyBlock}>
            <Text style={styles.reviewTitle}>本周摘要</Text>
            {weekly.topAchievements.length > 0 ? (
              weekly.topAchievements.map((item) => (
                <Text key={item} style={styles.item}>
                  {item}
                </Text>
              ))
            ) : (
              <Text style={styles.empty}>暂无可汇总内容</Text>
            )}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function getWeeklyReport(reviews: ReviewCard[]) {
  const weekStart = startOfWeek(new Date());
  const items = reviews
    .filter((review) => new Date(review.createdAt) >= weekStart)
    .slice()
    .reverse();
  const averageMood =
    items.length > 0
      ? Math.round((items.reduce((sum, item) => sum + item.moodScore, 0) / items.length) * 10) / 10
      : null;
  const topAchievements = items.flatMap((item) => item.achievements).slice(0, 5);
  return {
    items,
    count: items.length,
    averageMood,
    achievementCount: items.reduce((sum, item) => sum + item.achievements.length, 0),
    topAchievements,
  };
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatShortDate(value: string): string {
  const d = new Date(value);
  return `${d.getMonth() + 1}/${d.getDate()}`;
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
  historyBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  historyRow: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.xs,
  },
  historyDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  historyText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  historyMood: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
  },
  metricValue: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  metricLabel: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  trendBlock: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  trendBars: {
    height: 180,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  trendTrack: {
    width: '100%',
    height: 140,
    maxWidth: 32,
    justifyContent: 'flex-end',
    borderRadius: 8,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  trendFill: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  trendLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  weeklyBlock: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});
