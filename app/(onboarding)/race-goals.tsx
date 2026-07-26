import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../src/utils/theme';
import { useProfileStore } from '../../src/stores/profileStore';

const RACE_TYPES = [
  { value: 'sprint', label: '스프린트', desc: '수영 750m, 사이클 20km, 러닝 5km' },
  { value: 'olympic', label: '올림픽', desc: '수영 1.5km, 사이클 40km, 러닝 10km' },
  { value: 'half_ironman', label: '하프 아이언맨', desc: '수영 1.9km, 사이클 90km, 러닝 21km' },
  { value: 'full_ironman', label: '풀 아이언맨', desc: '수영 3.8km, 사이클 180km, 러닝 42.2km' },
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.step}>4 / 4</Text>
      <Text style={styles.title}>목표 레이스</Text>
      <Text style={styles.subtitle}>어떤 레이스를 준비하고 있나요?</Text>

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

      <Text style={styles.label}>목표 레이스 날짜 (선택)</Text>
      <TextInput style={styles.input} placeholder="예: 2025-10-15" placeholderTextColor={colors.textMuted}
        value={targetDate} onChangeText={setTargetDate} keyboardType="numbers-and-punctuation" />

      <TouchableOpacity style={styles.btn} onPress={handleFinish}>
        <Text style={styles.btnText}>훈련 시작! 🔥</Text>
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
