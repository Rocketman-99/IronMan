import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Alert, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSQLiteContext } from 'expo-sqlite';
import { useProfileStore } from '../../../src/stores/profileStore';
import { Button } from '../../../src/components/common/Button';
import { colors, fitnessLevelLabels, raceTypeLabels } from '../../../src/utils/theme';
import { type FitnessLevel, type Gender, type RaceType } from '../../../src/types';

const FITNESS_LEVELS: Array<{ value: FitnessLevel; label: string }> = [
  { value: 'beginner', label: fitnessLevelLabels.beginner },
  { value: 'intermediate', label: fitnessLevelLabels.intermediate },
  { value: 'advanced', label: fitnessLevelLabels.advanced },
  { value: 'elite', label: fitnessLevelLabels.elite },
];

const GENDERS: Array<{ value: Gender; label: string }> = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'other', label: '기타' },
];

const RACE_TYPES: Array<{ value: RaceType; label: string }> = [
  { value: 'sprint', label: raceTypeLabels.sprint },
  { value: 'olympic', label: raceTypeLabels.olympic },
  { value: 'half_ironman', label: raceTypeLabels.half_ironman },
  { value: 'full_ironman', label: raceTypeLabels.full_ironman },
];

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const { profile, loadProfile, saveProfile } = useProfileStore();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>('beginner');
  const [primaryGoal, setPrimaryGoal] = useState<RaceType>('olympic');
  const [targetRaceDate, setTargetRaceDate] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [restingHr, setRestingHr] = useState('');
  const [maxHr, setMaxHr] = useState('');

  useEffect(() => {
    loadProfile(db);
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setBirthDate(profile.birth_date ?? '');
      setGender((profile.gender as Gender) ?? 'male');
      setHeightCm(profile.height_cm != null ? String(profile.height_cm) : '');
      setWeightKg(profile.weight_kg != null ? String(profile.weight_kg) : '');
      setFitnessLevel((profile.fitness_level as FitnessLevel) ?? 'beginner');
      setPrimaryGoal((profile.primary_goal as RaceType) ?? 'olympic');
      setTargetRaceDate(profile.target_race_date ?? '');
      setWeeklyHours(profile.weekly_hours != null ? String(profile.weekly_hours) : '');
      setRestingHr(profile.resting_hr != null ? String(profile.resting_hr) : '');
      setMaxHr(profile.max_hr != null ? String(profile.max_hr) : '');
    }
  }, [profile]);

  async function handleSave() {
    if (!name.trim()) return Alert.alert('이름을 입력해주세요');
    setSaving(true);
    try {
      await saveProfile(db, {
        name: name.trim(),
        birth_date: birthDate || undefined,
        gender,
        height_cm: heightCm ? parseFloat(heightCm) : undefined,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        fitness_level: fitnessLevel,
        primary_goal: primaryGoal,
        target_race_date: targetRaceDate || undefined,
        weekly_hours: weeklyHours ? parseFloat(weeklyHours) : 5,
        resting_hr: restingHr ? parseInt(restingHr) : undefined,
        max_hr: maxHr ? parseInt(maxHr) : undefined,
      });
      Alert.alert('저장 완료', '프로필이 업데이트되었습니다.');
    } catch {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>프로필</Text>
      </View>
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >

          <Field label="이름 *">
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="이름" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="생년월일">
            <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="성별">
            <View style={styles.chips}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.chip, gender === g.value && styles.chipActive]}
                  onPress={() => setGender(g.value)}
                >
                  <Text style={[styles.chipText, gender === g.value && styles.chipTextActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>키 (cm)</Text>
              <TextInput style={styles.input} value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" placeholder="175" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>몸무게 (kg)</Text>
              <TextInput style={styles.input} value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" placeholder="70" placeholderTextColor={colors.textMuted} />
            </View>
          </View>

          <Field label="피트니스 레벨">
            <View style={styles.chips}>
              {FITNESS_LEVELS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.chip, fitnessLevel === f.value && styles.chipActive]}
                  onPress={() => setFitnessLevel(f.value)}
                >
                  <Text style={[styles.chipText, fitnessLevel === f.value && styles.chipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="목표 레이스">
            <View style={styles.chips}>
              {RACE_TYPES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.chip, primaryGoal === r.value && styles.chipActive]}
                  onPress={() => setPrimaryGoal(r.value)}
                >
                  <Text style={[styles.chipText, primaryGoal === r.value && styles.chipTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="목표 레이스 날짜">
            <TextInput style={styles.input} value={targetRaceDate} onChangeText={setTargetRaceDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="주간 훈련 가능 시간">
            <TextInput style={styles.input} value={weeklyHours} onChangeText={setWeeklyHours} keyboardType="decimal-pad" placeholder="5" placeholderTextColor={colors.textMuted} />
          </Field>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>안정시 심박수</Text>
              <TextInput style={styles.input} value={restingHr} onChangeText={setRestingHr} keyboardType="number-pad" placeholder="60" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>최대 심박수</Text>
              <TextInput style={styles.input} value={maxHr} onChangeText={setMaxHr} keyboardType="number-pad" placeholder="190" placeholderTextColor={colors.textMuted} />
            </View>
          </View>

        <Button label="저장" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 14 },
  fieldLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: colors.card, borderRadius: 10, padding: 13,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#1A0808' },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: colors.primaryLight, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  halfField: { flex: 1 },
  saveBtn: { marginTop: 8, borderRadius: 14 },
});
