import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../src/utils/theme';
import { useProfileStore } from '../../src/stores/profileStore';
import { FITNESS_LEVELS } from '../../src/utils/constants';

export default function FitnessLevel() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveProfile } = useProfileStore();
  const [level, setLevel] = useState('beginner');
  const [weeklyHours, setWeeklyHours] = useState('5');
  const [restingHr, setRestingHr] = useState('');

  async function handleNext() {
    await saveProfile(db, {
      fitness_level: level as any,
      weekly_hours: parseFloat(weeklyHours) || 5,
      resting_hr: restingHr ? parseInt(restingHr) : undefined,
    });
    router.push('/(onboarding)/race-goals');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.step}>3 / 4</Text>
      <Text style={styles.title}>피트니스 레벨</Text>
      <Text style={styles.subtitle}>현재 훈련 수준을 알려주세요</Text>

      <View style={styles.levelList}>
        {FITNESS_LEVELS.map(fl => (
          <TouchableOpacity
            key={fl.value}
            style={[styles.levelCard, level === fl.value && styles.levelCardActive]}
            onPress={() => setLevel(fl.value)}
          >
            <View style={styles.levelLeft}>
              <Text style={styles.levelName}>{fl.label}</Text>
              <Text style={styles.levelDesc}>{fl.desc}</Text>
            </View>
            {level === fl.value && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>주간 목표 훈련 시간 (시간)</Text>
      <TextInput style={styles.input} value={weeklyHours} onChangeText={setWeeklyHours}
        keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} />

      <Text style={styles.label}>안정시 심박수 (선택)</Text>
      <TextInput style={styles.input} placeholder="예: 55" placeholderTextColor={colors.textMuted}
        value={restingHr} onChangeText={setRestingHr} keyboardType="number-pad" />

      <TouchableOpacity style={styles.btn} onPress={handleNext}>
        <Text style={styles.btnText}>다음 →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 60 },
  step: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  levelList: { gap: 10 },
  levelCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  levelCardActive: { borderColor: colors.primary, backgroundColor: colors.card },
  levelLeft: { flex: 1 },
  levelName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  levelDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  check: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
  btn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
