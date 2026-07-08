export interface ReviewSummary {
  achievements: string[];
  issues: string[];
  moodLabel: string;
  moodScore: number;
}

export type ReviewGenerationResult =
  | { ok: true; data: ReviewSummary }
  | { ok: false; reason: string };

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const REVIEW_MODEL = process.env.EXPO_PUBLIC_OPENAI_REVIEW_MODEL || 'gpt-5.5';

export async function generateReviewSummary(
  transcript: string,
): Promise<ReviewGenerationResult> {
  if (!OPENAI_API_KEY) {
    return { ok: false, reason: 'openai-api-key-missing' };
  }
  if (!transcript.trim()) {
    return { ok: false, reason: 'empty-transcript' };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: REVIEW_MODEL,
        input: [
          {
            role: 'system',
            content:
              '你是 FlowLens 的复盘整理助手。把用户的口语化复盘整理成简洁中文结构，只基于用户文本，不编造事实。',
          },
          {
            role: 'user',
            content: `请整理这段复盘转录：\n\n${transcript}`,
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'flowlens_review',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                achievements: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 0,
                  maxItems: 5,
                },
                issues: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 0,
                  maxItems: 5,
                },
                moodLabel: { type: 'string' },
                moodScore: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 10,
                },
              },
              required: ['achievements', 'issues', 'moodLabel', 'moodScore'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    const json = (await res.json()) as {
      output_text?: string;
      error?: { message?: string };
    };
    if (!res.ok) {
      return { ok: false, reason: json.error?.message ?? `review-failed-${res.status}` };
    }

    const parsed = JSON.parse(json.output_text ?? '{}') as ReviewSummary;
    return { ok: true, data: normalizeReview(parsed) };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'review-generation-error',
    };
  }
}

function normalizeReview(data: ReviewSummary): ReviewSummary {
  return {
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
    issues: Array.isArray(data.issues) ? data.issues : [],
    moodLabel: data.moodLabel || '未识别',
    moodScore: clampScore(data.moodScore),
  };
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 5;
  return Math.max(1, Math.min(10, Math.round(value)));
}
