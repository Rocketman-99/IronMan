import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useProfileStore } from '../../src/stores/profileStore';
import { Button } from '../../src/components/common/Button';
import { colors } from '../../src/utils/theme';

export default function OnboardingWelcome() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveProfile } = useProfileStore();
  const [name, setName] = useState('');

  async function handleNext() {
    if (!name.trim()) return;
    await saveProfile(db, { name: name.trim(), fitness_level: 'beginner', weekly_hours: 5 });
    router.push('/(onboarding)/body-metrics');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>⚙️</Text>
        <Text style={styles.title}>IronMan에{' '}오신 것을 환영합니다</Text>
        <Text style={styles.subtitle}>
          트라이애슬론 훈련을 체계적으로{' '}관리하고 성장시켜 드립니다
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>이름을 알려주세요</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="홍길동"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            onSubmitEditing={handleNext}
            autoFocus
          />
        </View>

        <View style={styles.progress}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>

        <Button
          label="다음"
          onPress={handleNext}
          disabled={!name.trim()}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 28, justifyContent: 'center' },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 24 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  form: { marginBottom: 40 },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  button: { borderRadius: 14 },
});
