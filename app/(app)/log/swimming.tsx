import { useState } from 'react';
import { t } from '../../../src/i18n/ko';
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
import { DatePicker } from '../../../src/components/common/DatePicker';
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
    if (!laps || !durationMin) { Alert.alert(t.common.error, t.log.needLapsDuration); return; }
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
      if (hasApiKey && workoutId && checkAndIncrementAIUsage('fast')) {
        analyzeWorkoutAI(db, workoutId, profile);
      }
      // 저장하고 그냥 뒤로 가면 저장이 됐는지 알 수 없다. 방금 만든 기록을 열어
      // AI 분석이 붙는 것까지 보이게 한다. replace 라서 뒤로가기는 기록 탭으로 간다.
      if (workoutId) router.replace(`/workout/${workoutId}`);
      else router.back();
    } catch {
      // 실패해도 조용히 닫히면 저장된 줄 안다.
      Alert.alert(t.common.error, t.common.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backText}>{t.log.swimmingTitle}</Text>
      </TouchableOpacity>

      {distanceM > 0 && (
        <View style={styles.distPreview}>
          <Text style={styles.distValue}>{distanceM}m</Text>
          <Text style={styles.distLabel}>{t.log.swimDistance}</Text>
        </View>
      )}

      <Text style={styles.label}>{t.log.date}</Text>
      <DatePicker value={date} onChange={setDate} />

      <Text style={styles.label}>{t.log.poolLength}</Text>
      <View style={styles.chips}>
        {['25', '50'].map(l => (
          <TouchableOpacity key={l} style={[styles.chip, poolLength === l && styles.chipActive]} onPress={() => setPoolLength(l)}>
            <Text style={[styles.chipText, poolLength === l && styles.chipTextActive]}>{l}m</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t.log.lapCount.replace('{m}', String(poolM))}</Text>
      <TextInput style={styles.input} placeholder="40" placeholderTextColor={colors.textMuted}
        value={laps} onChangeText={setLaps} keyboardType="number-pad" />

      <Text style={styles.label}>{t.log.duration}</Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <TextInput style={styles.input} placeholder={t.common.minute} placeholderTextColor={colors.textMuted}
            value={durationMin} onChangeText={setDurationMin} keyboardType="number-pad" />
        </View>
        <Text style={styles.timeSep}>:</Text>
        <View style={styles.half}>
          <TextInput style={styles.input} placeholder={t.common.second} placeholderTextColor={colors.textMuted}
            value={durationSec} onChangeText={setDurationSec} keyboardType="number-pad" />
        </View>
      </View>

      <Text style={styles.label}>{t.log.strokeType}</Text>
      <View style={styles.chips}>
        {STROKE_TYPES.map(s => (
          <TouchableOpacity key={s.value} style={[styles.chip, strokeType === s.value && styles.chipActive]} onPress={() => setStrokeType(s.value)}>
            <Text style={[styles.chipText, strokeType === s.value && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t.log.avgHr}</Text>
      <TextInput style={styles.input} placeholder="140" placeholderTextColor={colors.textMuted}
        value={avgHr} onChangeText={setAvgHr} keyboardType="number-pad" />

      <Text style={styles.label}>{t.log.condition}</Text>
      <FeelingSelector value={feeling} onChange={setFeeling} />

      <Text style={styles.label}>{t.log.notes}</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder={t.log.notesShort}
        placeholderTextColor={colors.textMuted} value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? t.common.saving : t.log.submit}</Text>
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
