import { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../src/utils/theme';
import { useProfileStore } from '../../src/stores/profileStore';
import { useAppStore } from '../../src/stores/appStore';

export default function AppLayout() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { profile, loadProfile } = useProfileStore();
  const { initialize } = useAppStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function boot() {
      await initialize();
      await loadProfile(db);
      setIsReady(true);
    }
    boot();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!profile || !profile.onboarding_done) {
      router.replace('/(onboarding)');
    }
  }, [isReady, profile]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '대시보드', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="log" options={{ title: '기록', tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: '역사', tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: '성장', tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color} /> }} />
      <Tabs.Screen name="goals" options={{ title: '목표', tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} /> }} />
      <Tabs.Screen name="workout" options={{ href: null }} />
      <Tabs.Screen name="ai" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
