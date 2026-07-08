import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Input } from './Input';
import { colors, spacing, fontSize, fontWeight, radius, shadow } from '@/theme/tokens';

interface NoteEditorProps {
  /** 初始标题 */
  initialTitle?: string;
  /** 初始正文 */
  initialBody?: string;
  /** 内容变化回调 */
  onChange?: (data: { title: string; body: string }) => void;
  /** 顶部时间戳（如 "今日 15:32"） */
  timestamp?: string;
  /** 正文最小行数 */
  minBodyLines?: number;
  /** 占位符 */
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
}

/**
 * 备忘录式编辑器
 * - 标题：单行，大号加粗
 * - 正文：多行，回车自由换行，随写随撑高
 * - 无边框，米黄纸张背景，模仿 iOS/安卓原生备忘录
 */
export function NoteEditor({
  initialTitle = '',
  initialBody = '',
  onChange,
  timestamp,
  minBodyLines = 8,
  titlePlaceholder = '标题',
  bodyPlaceholder = '开始输入正文，回车可以随意换行……',
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);

  const handleTitleChange = (t: string) => {
    setTitle(t);
    onChange?.({ title: t, body });
  };
  const handleBodyChange = (b: string) => {
    setBody(b);
    onChange?.({ title, body: b });
  };

  const wordCount = body.trim().length;

  return (
    <View style={[styles.sheet, shadow.sm]}>
      {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}

      <Input
        bare
        value={title}
        onChangeText={handleTitleChange}
        placeholder={titlePlaceholder}
        inputStyle={styles.titleInput}
      />

      <View style={styles.divider} />

      <Input
        bare
        multiline
        minLines={minBodyLines}
        value={body}
        onChangeText={handleBodyChange}
        placeholder={bodyPlaceholder}
        inputStyle={styles.bodyInput}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>{wordCount} 字</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    width: '100%',
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleInput: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  bodyInput: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    // Web 端保证长单词/URL 也能换行
    // @ts-ignore
    wordBreak: 'break-word',
  },
  footer: {
    marginTop: spacing.sm,
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
