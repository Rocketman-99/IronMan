import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../src/utils/theme';
import { useProfileStore } from '../../src/stores/profileStore';

const GENDERS = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'other', label: '기타' },
];

export default function BodyMetrics() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveProfile } = useProfileStore();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('male');

  async function handleNext() {
    await saveProfile(db, {
      height_cm: height ? parseFloat(height) : undefined,
      weight_kg: weight ? parseFloat(weight) : undefined,
      birth_date: birthDate || undefined,
      gender: gender as any,
    });
    router.push('/(onboarding)/fitness-level');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.step}>2 / 4</Text>
      <Text style={styles.title}>신체 정보</Text>
      <Text style={styles.subtitle}>훈련 강도 계산에 활용됩니다</Text>

      <Text style={styles.label}>성별</Text>
      <View style={styles.chips}>
        {GENDERS.map(g => (
          <TouchableOpacity
            key={g.value}
            style={[styles.chip, gender === g.value && styles.chipActive]}
            onPress={() => setGender(g.value)}
          >
            <Text style={[styles.chipText, gender === g.value && styles.chipTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>생년월일 (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} placeholder="예: 1990-01-15" placeholderTextColor={colors.textMuted}
        value={birthDate} onChangeText={setBirthDate} keyboardType="numbers-and-punctuation" />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>키 (cm)</Text>
          <TextInput style={styles.input} placeholder="175" placeholderTextColor={colors.textMuted}
            value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>몸무게 (kg)</Text>
          <TextInput style={styles.input} placeholder="70" placeholderTextColor={colors.textMuted}
            value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        </View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleNext}>
        <Text style={styles.btnText}>다음 →</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleNext}>
        <Text style={styles.skip}>건너뛰기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 60 },
  step: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  btn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: { color: colors.textMuted, textAlign: 'center', marginTop: 16, fontSize: 14 },
});
