import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrateDbIfNeeded } from '../src/db';
import { colors } from '../src/utils/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <SQLiteProvider databaseName="ironman.db" onInit={migrateDbIfNeeded}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(app)" />
            {/* Pushed above the tabs rather than living inside them, so going
                back returns to whichever tab opened the screen. */}
            <Stack.Screen name="ai" />
            <Stack.Screen name="workout" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="settings" />
          </Stack>
        </SQLiteProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
