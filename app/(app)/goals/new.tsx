import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useGoalsStore } from '../../../src/stores/goalsStore';
import { Button } from '../../../src/components/common/Button';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { colors } from '../../../src/utils/theme';
import { type SportType } from '../../../src/types';

const GOAL_TYPES = [
  { value: 'distance', label: '총 거리', unit: 'km' },
  { value: 'frequency', label: '운동 횟수', unit: '회' },
  { value: 'pace', label: '목표 페이스', unit: 'min/km' },
];

export default function NewGoal() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { createGoal } = useGoalsStore();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState<SportType | 'general'>('running');
  const [goalType, setGoalType] = useState('distance');
  const [targetValue, setTargetValue] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [targetDate, setTargetDate] = useState('');

  const selectedType = GOAL_TYPES.find(g => g.value === goalType);

  async function handleSave() {
    if (!title.trim()) return Alert.alert('목표 이름을 입력해주세요');
    if (!targetValue) return Alert.alert('목표값을 입력해주세요');
    setSaving(true);
    try {
      await createGoal(db, { sport_type: sport, goal_type: goalType as any, title: title.trim(), target_value: parseFloat(targetValue), unit: selectedType?.unit ?? '', period: period as any, target_date: targetDate || undefined });
      router.back();
    } catch {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally { setSaving(false); }
  }

  const sportOptions: Array<{ value: SportType | 'general'; label: string }> = [
    { value: 'running', label: '🏃 러닝' }, { value: 'swimming', label: '🏊 수영' },
    { value: 'cycling', label: '🚴 사이클' }, { value: 'general', label: '🏆 전체' },
  ];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="목표 추가" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Field label="목표 이름 *"><TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="예: 이번 달 100km 달리기" placeholderTextColor={colors.textMuted} /></Field>
        <Field label="종목">
          <View style={styles.chips}>{sportOptions.map(s => <TouchableOpacity key={s.value} style={[styles.chip, sport === s.value && styles.chipActive]} onPress={() => setSport(s.value)}><Text style={[styles.chipText, sport === s.value && styles.chipTextActive]}>{s.label}</Text></TouchableOpacity>)}</View>
        </Field>
        <Field label="목표 유형">
          <View style={styles.chips}>{GOAL_TYPES.map(g => <TouchableOpacity key={g.value} style={[styles.chip, goalType === g.value && styles.chipActive]} onPress={() => setGoalType(g.value)}><Text style={[styles.chipText, goalType === g.value && styles.chipTextActive]}>{g.label}</Text></TouchableOpacity>)}</View>
        </Field>
        <Field label={`목표값 (${selectedType?.unit ?? ''}) *`}><TextInput style={styles.input} value={targetValue} onChangeText={setTargetValue} keyboardType="decimal-pad" placeholder={goalType === 'distance' ? '100' : goalType === 'frequency' ? '12' : '5:30'} placeholderTextColor={colors.textMuted} /></Field>
        <Field label="기간">
          <View style={styles.chips}>{[{ value: 'weekly', label: '주간' }, { value: 'monthly', label: '월간' }, { value: 'total', label: '누적' }].map(p => <TouchableOpacity key={p.value} style={[styles.chip, period === p.value && styles.chipActive]} onPress={() => setPeriod(p.value)}><Text style={[styles.chipText, period === p.value && styles.chipTextActive]}>{p.label}</Text></TouchableOpacity>)}</View>
        </Field>
        <Field label="목표 날짜 (선택)"><TextInput style={styles.input} value={targetDate} onChangeText={setTargetDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} /></Field>
        <Button label="목표 저장" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 14 },
  fieldLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 13, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { borderColor: colors.primary, backgroundColor: '#1A0808' },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: colors.primaryLight, fontWeight: '600' },
  saveBtn: { marginTop: 8, borderRadius: 14 },
});
