import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../src/utils/theme';
import { useProfileStore } from '../../src/stores/profileStore';

export default function OnboardingWelcome() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveProfile } = useProfileStore();
  const [name, setName] = useState('');

  async function handleNext() {
    if (!name.trim()) return;
    await saveProfile(db, { name: name.trim() });
    router.push('/(onboarding)/body-metrics');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.logo}>🏊🚴🏃</Text>
        <Text style={styles.title}>IronMan</Text>
        <Text style={styles.subtitle}>트라이애슬론 훈련 파트너</Text>
        <Text style={styles.label}>이름을 알려주세요</Text>
        <TextInput
          style={styles.input}
          placeholder="이름 입력"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={handleNext}
        />
        <TouchableOpacity
          style={[styles.btn, !name.trim() && styles.btnDisabled]}
          onPress={handleNext}
          disabled={!name.trim()}
        >
          <Text style={styles.btnText}>시작하기 →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 36, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 48 },
  label: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 24,
  },
  btn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
