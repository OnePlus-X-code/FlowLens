import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '@/theme/tokens';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  /** 多行输入（备忘录式），自动换行 + 内容自适应高度 */
  multiline?: boolean;
  /** multiline 时的最小行数，默认 3 */
  minLines?: number;
  /** 无边框模式（备忘录/编辑器场景） */
  bare?: boolean;
}

export function Input({
  label,
  error,
  hint,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  multiline = false,
  minLines = 3,
  bare = false,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  // 估算最小高度（行高 * 行数 + 内边距）
  const lineHeight = Math.round(fontSize.md * 1.55);
  const minHeight = multiline
    ? lineHeight * minLines + spacing.sm * 2 + 4
    : undefined;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...rest}
        multiline={multiline}
        // Enter = 换行；只有单行才把回车视作提交
        blurOnSubmit={!multiline}
        // 保证 iOS/Android 上文本从顶部开始
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          bare ? styles.bare : styles.bordered,
          multiline && { lineHeight, minHeight, paddingTop: spacing.sm + 2 },
          !bare && focused && styles.inputFocused,
          !bare && !!error && styles.inputError,
          inputStyle,
        ]}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    // @ts-ignore Web-only：去掉浏览器默认高亮
    outlineStyle: 'none',
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  bare: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  inputFocused: { borderColor: colors.primary },
  inputError: { borderColor: colors.danger },
  error: { fontSize: fontSize.xs, color: colors.danger, marginTop: spacing.xs },
  hint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
});
