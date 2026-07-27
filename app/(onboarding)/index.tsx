import { useState } from 'react';
import { t } from '../../src/i18n/ko';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
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
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.content}>
        <Text style={styles.logo}>🏊🚴🏃</Text>
        <Text style={styles.title}>IronMan</Text>
        <Text style={styles.subtitle}>{t.onboarding.tagline}</Text>
        <Text style={styles.label}>{t.onboarding.askName}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.onboarding.namePlaceholder}
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
          <Text style={styles.btnText}>{t.common.start}</Text>
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
