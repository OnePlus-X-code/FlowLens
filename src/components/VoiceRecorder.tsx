import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { Button } from './Button';
import {
  isTranscriptionConfigured,
  transcribeAudioFile,
} from '@/services/transcriptionService';
import { colors, fontSize, fontWeight, spacing } from '@/theme/tokens';

type RecorderState = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';

interface VoiceRecorderProps {
  onTranscript?: (text: string) => void;
}

export function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const configured = isTranscriptionConfigured();

  const startRecording = async () => {
    setError(null);
    setTranscript('');

    if (!configured) {
      setState('error');
      setError('缺少 EXPO_PUBLIC_OPENAI_API_KEY，无法调用转录接口。');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        await startWebRecording();
      } else {
        await startNativeRecording();
      }
      setState('recording');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : '无法开始录音');
    }
  };

  const stopRecording = async () => {
    setState('transcribing');
    setError(null);

    try {
      const file =
        Platform.OS === 'web'
          ? await stopWebRecording()
          : await stopNativeRecording();
      const result = await transcribeAudioFile(file);
      if (!result.ok) {
        setState('error');
        setError(result.reason);
        return;
      }
      setTranscript(result.text);
      onTranscript?.(result.text);
      setState('done');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : '转录失败');
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>语音复盘</Text>
        <Text style={styles.status}>{statusText(state)}</Text>
      </View>

      <Text style={styles.body}>
        说完后停止录音，系统会把音频转成文字，后续 Task 8 会继续生成结构化复盘。
      </Text>

      <View style={styles.actions}>
        {state === 'recording' ? (
          <Button title="停止并转写" onPress={stopRecording} variant="danger" />
        ) : (
          <Button
            title="开始录音"
            onPress={startRecording}
            disabled={state === 'transcribing'}
            loading={state === 'transcribing'}
          />
        )}
        {transcript.length > 0 && (
          <Button title="重新录音" onPress={startRecording} variant="secondary" />
        )}
      </View>

      {!configured && (
        <Text style={styles.hint}>
          本地 MVP 需要在 .env 中配置 EXPO_PUBLIC_OPENAI_API_KEY。生产环境应改为后端代理。
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {transcript.length > 0 && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptLabel}>转录结果</Text>
          <Text style={styles.transcript}>{transcript}</Text>
        </View>
      )}
    </View>
  );
}

async function startNativeRecording() {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) throw new Error('未获得麦克风权限');

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  nativeRecordingRef.current = recording;
}

const nativeRecordingRef: { current: Audio.Recording | null } = { current: null };

async function stopNativeRecording() {
  const recording = nativeRecordingRef.current;
  if (!recording) throw new Error('没有正在进行的录音');
  nativeRecordingRef.current = null;
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  if (!uri) throw new Error('录音文件生成失败');
  return { uri, name: 'flowlens-review.m4a', type: 'audio/m4a' };
}

async function startWebRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('当前浏览器不支持录音');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  webRecorderRef.current = recorder;
  webChunksRef.current = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) webChunksRef.current.push(event.data);
  };
  recorder.start();
}

const webRecorderRef: { current: MediaRecorder | null } = { current: null };
const webChunksRef: { current: Blob[] } = { current: [] };

async function stopWebRecording(): Promise<File> {
  const recorder = webRecorderRef.current;
  if (!recorder) throw new Error('没有正在进行的录音');

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      try {
        recorder.stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(webChunksRef.current, { type: 'audio/webm' });
        webRecorderRef.current = null;
        webChunksRef.current = [];
        resolve(new File([blob], 'flowlens-review.webm', { type: 'audio/webm' }));
      } catch (error) {
        reject(error);
      }
    };
    recorder.stop();
  });
}

function statusText(state: RecorderState): string {
  switch (state) {
    case 'recording':
      return '录音中';
    case 'transcribing':
      return '转写中';
    case 'done':
      return '已完成';
    case 'error':
      return '需要处理';
    default:
      return '待开始';
  }
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  status: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.danger,
    lineHeight: 20,
  },
  transcriptBox: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  transcriptLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
  transcript: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
