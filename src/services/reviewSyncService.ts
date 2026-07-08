import { supabase, isSupabaseConfigured } from './supabase';
import type { ReviewSummary } from './llmReviewService';

export interface ReviewCard extends ReviewSummary {
  id: string;
  transcript: string;
  createdAt: string;
}

interface RemoteReviewRow {
  id: string;
  user_id: string;
  transcript: string;
  achievements: string[];
  issues: string[];
  mood_label: string | null;
  mood_score: number | null;
  created_at: string;
  updated_at: string;
}

export type ReviewSyncResult<T = unknown> =
  | { ok: true; skipped?: boolean; reason?: string; data?: T }
  | { ok: false; reason: string };

export async function saveReview(
  transcript: string,
  summary: ReviewSummary,
): Promise<ReviewSyncResult<ReviewCard>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: true, skipped: true, reason: 'supabase-not-configured' };
  }

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: true, skipped: true, reason: 'not-signed-in' };

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: uid,
      transcript,
      achievements: summary.achievements,
      issues: summary.issues,
      mood_label: summary.moodLabel,
      mood_score: summary.moodScore,
    })
    .select('*')
    .single();

  if (error) return { ok: false, reason: error.message };
  return { ok: true, data: rowToReview(data as RemoteReviewRow) };
}

export async function fetchReviews(): Promise<ReviewSyncResult<ReviewCard[]>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: true, skipped: true, reason: 'supabase-not-configured', data: [] };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return { ok: true, skipped: true, reason: 'not-signed-in', data: [] };

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { ok: false, reason: error.message };
  return { ok: true, data: ((data ?? []) as RemoteReviewRow[]).map(rowToReview) };
}

function rowToReview(row: RemoteReviewRow): ReviewCard {
  return {
    id: row.id,
    transcript: row.transcript,
    achievements: row.achievements ?? [],
    issues: row.issues ?? [],
    moodLabel: row.mood_label ?? '未识别',
    moodScore: row.mood_score ?? 5,
    createdAt: row.created_at,
  };
}
