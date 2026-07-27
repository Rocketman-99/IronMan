import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/utils/theme';
import { useGoalsStore } from '../../../src/stores/goalsStore';
import { type SportType, type GoalType, type GoalPeriod } from '../../../src/types';

const SPORTS: { value: SportType | 'general'; label: string }[] = [
  { value: 'running', label: '러닝' },
  { value: 'swimming', label: '수영' },
  { value: 'cycling', label: '사이클' },
];
const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: 'distance', label: '거리' },
  { value: 'time', label: '시간' },
  { value: 'frequency', label: '횟수' },
  { value: 'pace', label: '페이스' },
];
const PERIODS: { value: GoalPeriod; label: string }[] = [
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
  { value: 'total', label: '누적' },
];

export default function NewGoal() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { createGoal } = useGoalsStore();

  const [sport, setSport] = useState<SportType | 'general'>('running');
  const [goalType, setGoalType] = useState<GoalType>('distance');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('km');
  const [period, setPeriod] = useState<GoalPeriod>('weekly');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title || !targetValue) { Alert.alert('오류', '제목과 목표치를 입력하세요'); return; }
    setSaving(true);
    try {
      await createGoal(db, {
        sport_type: sport,
        goal_type: goalType,
        title,
        target_value: parseFloat(targetValue),
        unit,
        period,
        target_date: targetDate || undefined,
      });
      router.back();
    } finally { setSaving(false); }
  }

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backText}>새 목표</Text>
      </TouchableOpacity>

      <Text style={styles.label}>종목</Text>
      <View style={styles.chips}>
        {SPORTS.map(s => (
          <TouchableOpacity key={s.value} style={[styles.chip, sport === s.value && styles.chipActive]} onPress={() => setSport(s.value)}>
            <Text style={[styles.chipText, sport === s.value && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>목표 유형</Text>
      <View style={styles.chips}>
        {GOAL_TYPES.map(g => (
          <TouchableOpacity key={g.value} style={[styles.chip, goalType === g.value && styles.chipActive]} onPress={() => setGoalType(g.value)}>
            <Text style={[styles.chipText, goalType === g.value && styles.chipTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>목표 제목</Text>
      <TextInput style={styles.input} placeholder="예: 주간 30km 러닝" placeholderTextColor={colors.textMuted}
        value={title} onChangeText={setTitle} />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>목표치</Text>
          <TextInput style={styles.input} placeholder="30" placeholderTextColor={colors.textMuted}
            value={targetValue} onChangeText={setTargetValue} keyboardType="decimal-pad" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>단위</Text>
          <TextInput style={styles.input} placeholder="km" placeholderTextColor={colors.textMuted}
            value={unit} onChangeText={setUnit} />
        </View>
      </View>

      <Text style={styles.label}>기간</Text>
      <View style={styles.chips}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p.value} style={[styles.chip, period === p.value && styles.chipActive]} onPress={() => setPeriod(p.value)}>
            <Text style={[styles.chipText, period === p.value && styles.chipTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>목표 날짜 (선택)</Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted}
        value={targetDate} onChangeText={setTargetDate} />

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '목표 저장'}</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 4 },
  backText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
