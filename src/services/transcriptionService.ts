export type TranscriptionResult =
  | { ok: true; text: string }
  | { ok: false; reason: string };

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export function isTranscriptionConfigured(): boolean {
  return !!OPENAI_API_KEY;
}

export async function transcribeAudioFile(
  file: Blob | { uri: string; name: string; type: string },
): Promise<TranscriptionResult> {
  if (!OPENAI_API_KEY) {
    return { ok: false, reason: 'openai-api-key-missing' };
  }

  const form = new FormData();
  form.append('model', 'whisper-1');
  form.append('response_format', 'json');
  form.append('file', file as unknown as Blob);

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: form,
    });

    const json = (await res.json()) as { text?: string; error?: { message?: string } };
    if (!res.ok) {
      return {
        ok: false,
        reason: json.error?.message ?? `transcription-failed-${res.status}`,
      };
    }

    return { ok: true, text: json.text ?? '' };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'transcription-network-error',
    };
  }
}
