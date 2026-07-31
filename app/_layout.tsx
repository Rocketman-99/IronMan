import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrateDbIfNeeded } from '../src/db';
import { colors } from '../src/utils/theme';
import { UpdateBanner } from '../src/components/common/UpdateBanner';

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
          {/* Stack 뒤에 두어야 모든 화면 위에 뜬다. 무선 업데이트를 받는 중인지,
              적용할 준비가 됐는지 알려준다 — 없으면 아무것도 렌더하지 않는다. */}
          <UpdateBanner />
        </SQLiteProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
