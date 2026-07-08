import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableStateCallbackType,
} from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const sizeStyle: ViewStyle = {
    sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md },
    md: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg },
    lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  }[size];

  const textSize: TextStyle = {
    sm: { fontSize: fontSize.sm },
    md: { fontSize: fontSize.md },
    lg: { fontSize: fontSize.lg },
  }[size];

  const variantStyle: ViewStyle = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.primarySoft },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.danger },
  }[variant];

  const variantTextColor: TextStyle = {
    primary: { color: colors.textInverse },
    secondary: { color: colors.primary },
    ghost: { color: colors.textPrimary },
    danger: { color: colors.textInverse },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.base,
        sizeStyle,
        variantStyle,
        fullWidth && { alignSelf: 'stretch' },
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantTextColor.color as string} />
      ) : (
        <Text style={[styles.text, textSize, variantTextColor, textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: { fontWeight: fontWeight.semibold },
});
