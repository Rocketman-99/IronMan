import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrateDbIfNeeded } from '../src/db';
import { useAppStore } from '../src/stores/appStore';
import { useProfileStore } from '../src/stores/profileStore';
import { colors } from '../src/utils/theme';
import '../global.css';

function InitGate() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { isInitialized, initialize } = useAppStore();
  const { profile, loadProfile } = useProfileStore();

  useEffect(() => {
    (async () => {
      await initialize();
      await loadProfile(db);
    })();
  }, []);

  useEffect(() => {
    if (!isInitialized || profile === undefined) return;

    if (profile === null || !profile.onboarding_done) {
      router.replace('/(onboarding)');
    } else {
      router.replace('/(app)');
    }
  }, [isInitialized, profile]);

  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="ironman.db" onInit={migrateDbIfNeeded}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <InitGate />
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});
