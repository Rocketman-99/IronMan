import { useState } from 'react';
import { t } from '../../src/i18n/ko';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../src/utils/theme';
import { useProfileStore } from '../../src/stores/profileStore';

const RACE_TYPES = [
  { value: 'sprint', label: t.raceTypeShort.sprint, desc: t.raceTypeDetailComma.sprint },
  { value: 'olympic', label: t.raceTypeShort.olympic, desc: t.raceTypeDetailComma.olympic },
  { value: 'half_ironman', label: t.raceTypeShort.half_ironman, desc: t.raceTypeDetailComma.half_ironman },
  { value: 'full_ironman', label: t.raceTypeShort.full_ironman, desc: t.raceTypeDetailComma.full_ironman },
];

export default function RaceGoals() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveProfile, completeOnboarding } = useProfileStore();
  const [raceType, setRaceType] = useState('olympic');
  const [targetDate, setTargetDate] = useState('');

  async function handleFinish() {
    await saveProfile(db, {
      primary_goal: raceType as any,
      target_race_date: targetDate || undefined,
    });
    await completeOnboarding(db);
    router.replace('/(app)');
  }

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
      <Text style={styles.step}>4 / 4</Text>
      <Text style={styles.title}>{t.profile.goalRace}</Text>
      <Text style={styles.subtitle}>{t.onboarding.raceTitle}</Text>

      <View style={styles.raceList}>
        {RACE_TYPES.map(rt => (
          <TouchableOpacity
            key={rt.value}
            style={[styles.raceCard, raceType === rt.value && styles.raceCardActive]}
            onPress={() => setRaceType(rt.value)}
          >
            <Text style={[styles.raceName, raceType === rt.value && styles.raceNameActive]}>{rt.label}</Text>
            <Text style={styles.raceDesc}>{rt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t.onboarding.raceDate}</Text>
      <TextInput style={styles.input} placeholder={t.onboarding.raceDateHint} placeholderTextColor={colors.textMuted}
        value={targetDate} onChangeText={setTargetDate} keyboardType="numbers-and-punctuation" />

      <TouchableOpacity style={styles.btn} onPress={handleFinish}>
        <Text style={styles.btnText}>{t.onboarding.finish}</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 60 },
  step: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  raceList: { gap: 10 },
  raceCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.cardBorder },
  raceCardActive: { borderColor: colors.primary, borderWidth: 2 },
  raceName: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  raceNameActive: { color: colors.primary },
  raceDesc: { color: colors.textSecondary, fontSize: 12 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 24 },
  input: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
  btn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
