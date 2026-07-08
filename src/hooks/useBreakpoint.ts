import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/**
 * 响应式断点钩子
 * < 768: mobile（极简列表）
 * 768-1024: tablet
 * >= 1024: desktop（分栏 / 看板）
 */
export function useBreakpoint(): {
  bp: Breakpoint;
  isMobile: boolean;
  isDesktop: boolean;
  width: number;
} {
  const { width } = useWindowDimensions();
  let bp: Breakpoint = 'mobile';
  if (width >= 1024) bp = 'desktop';
  else if (width >= 768) bp = 'tablet';
  return {
    bp,
    isMobile: bp === 'mobile',
    isDesktop: bp === 'desktop',
    width,
  };
}
