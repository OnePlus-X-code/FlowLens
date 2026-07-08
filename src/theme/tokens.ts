/**
 * FlowLens 设计令牌（Design Tokens）
 * 单一数据源，所有组件从这里读取样式常量。
 */

export const colors = {
  // 主色 / 强调色
  primary: '#4F46E5',      // 靛蓝，代表专注
  primaryHover: '#4338CA',
  primarySoft: '#EEF2FF',

  // 中性色
  bg: '#F7F8FA',           // 页面背景
  surface: '#FFFFFF',      // 卡片 / 面板
  paper: '#FFFCF2',        // 备忘录纸张色（米黄）
  border: '#E5E7EB',
  divider: '#F1F2F4',

  // 文本
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // 语义色
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // 遮罩
  overlay: 'rgba(17, 24, 39, 0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 30,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadow = {
  // React Native 端使用 shadow*，Web 端由 RNW 自动转 boxShadow
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadow,
};

export type Theme = typeof theme;
