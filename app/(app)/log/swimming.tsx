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
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import { useProfileStore } from '../../../src/stores/profileStore';
import { useAIStore } from '../../../src/stores/aiStore';
import { useAppStore } from '../../../src/stores/appStore';
import { FeelingSelector } from '../../../src/components/workout/FeelingSelector';
import { getTodayKST } from '../../../src/utils/formatters';
import { STROKE_TYPES } from '../../../src/utils/constants';

export default function SwimmingLog() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveWorkout } = useWorkoutStore();
  const { profile } = useProfileStore();
  const { analyzeWorkoutAI } = useAIStore();
  const { hasApiKey, checkAndIncrementAIUsage } = useAppStore();

  const [date, setDate] = useState(getTodayKST());
  const [poolLength, setPoolLength] = useState('25');
  const [laps, setLaps] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [durationSec, setDurationSec] = useState('');
  const [strokeType, setStrokeType] = useState('freestyle');
  const [avgHr, setAvgHr] = useState('');
  const [feeling, setFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const totalSec = (parseInt(durationMin) || 0) * 60 + (parseInt(durationSec) || 0);
  const poolM = parseInt(poolLength) || 25;
  const totalLaps = parseInt(laps) || 0;
  const distanceM = totalLaps * poolM;

  async function handleSave() {
    if (!laps || !durationMin) { Alert.alert('오류', '랩 수와 시간을 입력하세요'); return; }
    setSaving(true);
    try {
      const workoutId = await saveWorkout(db, {
        sport_type: 'swimming',
        workout_date: date,
        duration_sec: totalSec,
        distance_m: distanceM,
        avg_hr: avgHr ? parseInt(avgHr) : undefined,
        feeling: feeling ?? undefined,
        notes: notes || undefined,
        swimming: {
          pool_length_m: poolM,
          total_laps: totalLaps,
          avg_pace_sec_100m: distanceM > 0 && totalSec > 0 ? Math.round(totalSec / (distanceM / 100)) : undefined,
          stroke_type: strokeType,
        },
      });
      if (hasApiKey && workoutId && checkAndIncrementAIUsage('haiku')) {
        analyzeWorkoutAI(db, workoutId, profile);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backText}>수영 기록</Text>
      </TouchableOpacity>

      {distanceM > 0 && (
        <View style={styles.distPreview}>
          <Text style={styles.distValue}>{distanceM}m</Text>
          <Text style={styles.distLabel}>수영 거리</Text>
        </View>
      )}

      <Text style={styles.label}>날짜</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholderTextColor={colors.textMuted} />

      <Text style={styles.label}>수영장 길이</Text>
      <View style={styles.chips}>
        {['25', '50'].map(l => (
          <TouchableOpacity key={l} style={[styles.chip, poolLength === l && styles.chipActive]} onPress={() => setPoolLength(l)}>
            <Text style={[styles.chipText, poolLength === l && styles.chipTextActive]}>{l}m</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>랩 수 (1랩 = {poolM}m)</Text>
      <TextInput style={styles.input} placeholder="40" placeholderTextColor={colors.textMuted}
        value={laps} onChangeText={setLaps} keyboardType="number-pad" />

      <Text style={styles.label}>시간</Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <TextInput style={styles.input} placeholder="분" placeholderTextColor={colors.textMuted}
            value={durationMin} onChangeText={setDurationMin} keyboardType="number-pad" />
        </View>
        <Text style={styles.timeSep}>:</Text>
        <View style={styles.half}>
          <TextInput style={styles.input} placeholder="초" placeholderTextColor={colors.textMuted}
            value={durationSec} onChangeText={setDurationSec} keyboardType="number-pad" />
        </View>
      </View>

      <Text style={styles.label}>영법</Text>
      <View style={styles.chips}>
        {STROKE_TYPES.map(s => (
          <TouchableOpacity key={s.value} style={[styles.chip, strokeType === s.value && styles.chipActive]} onPress={() => setStrokeType(s.value)}>
            <Text style={[styles.chipText, strokeType === s.value && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>평균 심박수</Text>
      <TextInput style={styles.input} placeholder="140" placeholderTextColor={colors.textMuted}
        value={avgHr} onChangeText={setAvgHr} keyboardType="number-pad" />

      <Text style={styles.label}>컨디션</Text>
      <FeelingSelector value={feeling} onChange={setFeeling} />

      <Text style={styles.label}>메모</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="훈련 내용..."
        placeholderTextColor={colors.textMuted} value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '훈련 저장'}</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 4 },
  backText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  distPreview: { backgroundColor: colors.swimming + '22', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 },
  distValue: { color: colors.swimming, fontSize: 32, fontWeight: '800' },
  distLabel: { color: colors.textSecondary, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  half: { flex: 1 },
  timeSep: { color: colors.text, fontSize: 20, fontWeight: '700', paddingBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.swimming, borderColor: colors.swimming },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
