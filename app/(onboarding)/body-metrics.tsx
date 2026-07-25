import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useProfileStore } from '../../src/stores/profileStore';
import { Button } from '../../src/components/common/Button';
import { colors } from '../../src/utils/theme';
import { type Gender } from '../../src/types';

export default function BodyMetrics() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveProfile } = useProfileStore();
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  async function handleNext() {
    let birth_date: string | undefined;
    if (birthYear && birthMonth && birthDay) {
      birth_date = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
    }

    await saveProfile(db, {
      birth_date,
      gender: gender ?? undefined,
      height_cm: height ? parseFloat(height) : undefined,
      weight_kg: weight ? parseFloat(weight) : undefined,
    });
    router.push('/(onboarding)/fitness-level');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>신체 정보 입력</Text>
        <Text style={styles.subtitle}>정확한 훈련 코칭을 위해 필요합니다</Text>

        <Text style={styles.label}>생년월일</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            value={birthYear}
            onChangeText={setBirthYear}
            placeholder="1990"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={4}
          />
          <Text style={styles.dateSep}>년</Text>
          <TextInput
            style={[styles.input, styles.dateInputSm]}
            value={birthMonth}
            onChangeText={setBirthMonth}
            placeholder="01"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.dateSep}>월</Text>
          <TextInput
            style={[styles.input, styles.dateInputSm]}
            value={birthDay}
            onChangeText={setBirthDay}
            placeholder="01"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.dateSep}>일</Text>
        </View>

        <Text style={styles.label}>성별</Text>
        <View style={styles.genderRow}>
          {(['male', 'female', 'other'] as Gender[]).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                {g === 'male' ? '남성' : g === 'female' ? '여성' : '기타'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>키 (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="170"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>몸무게 (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="65"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.progress}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.buttons}>
          <Button label="이전" variant="secondary" onPress={() => router.back()} style={styles.btnHalf} />
          <Button label="다음" onPress={handleNext} style={styles.btnHalf} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 28 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 40, marginBottom: 8 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: 32 },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateInput: { flex: 2 },
  dateInputSm: { flex: 1 },
  dateSep: { color: colors.textSecondary, fontSize: 14 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  genderBtnActive: { borderColor: colors.primary },
  genderText: { color: colors.textSecondary, fontSize: 15 },
  genderTextActive: { color: colors.text, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 40, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  buttons: { flexDirection: 'row', gap: 12 },
  btnHalf: { flex: 1, borderRadius: 14 },
});
