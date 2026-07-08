import { Tabs } from 'expo-router';
import { useBreakpoint } from '@/hooks/useBreakpoint';

/**
 * 底部/侧边导航骨架
 * Mobile: 底部 Tab
 * Desktop: 顶部标签（Expo Router 目前 Web 端 Tabs 呈现为顶部）
 */
export default function TabsLayout() {
  const { isDesktop } = useBreakpoint();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        tabBarLabelStyle: { fontSize: isDesktop ? 14 : 12 },
        tabBarStyle: isDesktop ? { height: 56 } : undefined,
      }}
    >
      <Tabs.Screen name="index" options={{ title: '今日' }} />
      <Tabs.Screen name="review" options={{ title: '复盘' }} />
      <Tabs.Screen name="settings" options={{ title: '设置' }} />
    </Tabs>
  );
}
