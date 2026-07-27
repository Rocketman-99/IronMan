import { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/utils/theme';
import { t } from '../../src/i18n/ko';
import { useProfileStore } from '../../src/stores/profileStore';
import { useAppStore } from '../../src/stores/appStore';

export default function AppLayout() {
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
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
          // Android draws edge-to-edge, so the system navigation bar sits on top
          // of the app. Without the inset the tab buttons land underneath it.
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.dashboard, tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="log" options={{ title: t.tabs.log, tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: t.tabs.history, tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: t.tabs.progress, tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color} /> }} />
      <Tabs.Screen name="goals" options={{ title: t.tabs.goals, tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} /> }} />
    </Tabs>
  );
}
