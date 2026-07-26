import { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/utils/theme';
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import { useProfileStore } from '../../../src/stores/profileStore';
import { useAIStore } from '../../../src/stores/aiStore';
import { useAppStore } from '../../../src/stores/appStore';
import { FeelingSelector } from '../../../src/components/workout/FeelingSelector';
import { getTodayKST, calcPaceSecPerKm, formatPace, estimateCalories } from '../../../src/utils/formatters';
import { SURFACES } from '../../../src/utils/constants';

export default function RunningLog() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveWorkout } = useWorkoutStore();
  const { profile } = useProfileStore();
  const { analyzeWorkoutAI } = useAIStore();
  const { hasApiKey, checkAndIncrementAIUsage } = useAppStore();

  const [date, setDate] = useState(getTodayKST());
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [durationSec, setDurationSec] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [maxHr, setMaxHr] = useState('');
  const [cadence, setCadence] = useState('');
  const [elevation, setElevation] = useState('');
  const [surface, setSurface] = useState('road');
  const [calories, setCalories] = useState('');
  const [feeling, setFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const totalSec = (parseInt(durationMin) || 0) * 60 + (parseInt(durationSec) || 0);
  const distanceM = (parseFloat(distanceKm) || 0) * 1000;
  const pace = distanceM > 0 && totalSec > 0 ? formatPace(calcPaceSecPerKm(distanceM, totalSec)) : '--:--';
  const estCalories = distanceM > 0 && profile?.weight_kg ? estimateCalories('running', totalSec, profile.weight_kg) : 0;

  async function handleSave() {
    if (!distanceKm || !durationMin) { Alert.alert('오류', '거리와 시간을 입력하세요'); return; }
    setSaving(true);
    try {
      const workoutId = await saveWorkout(db, {
        sport_type: 'running',
        workout_date: date,
        duration_sec: totalSec,
        distance_m: distanceM,
        calories: calories ? parseInt(calories) : (estCalories || undefined),
        avg_hr: avgHr ? parseInt(avgHr) : undefined,
        max_hr: maxHr ? parseInt(maxHr) : undefined,
        feeling: feeling ?? undefined,
        notes: notes || undefined,
        running: {
          avg_pace_sec_km: calcPaceSecPerKm(distanceM, totalSec),
          cadence_spm: cadence ? parseInt(cadence) : undefined,
          elevation_gain_m: elevation ? parseFloat(elevation) : undefined,
          surface,
        },
      });
      if (hasApiKey && workoutId && checkAndIncrementAIUsage('haiku')) {
        analyzeWorkoutAI(db, workoutId, profile);
      }
      router.back();
    } catch (e) {
      Alert.alert('오류', '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backText}>러닝 기록</Text>
      </TouchableOpacity>

      {pace !== '--:--' && (
        <View style={styles.pacePreview}>
          <Text style={styles.paceValue}>{pace}</Text>
          <Text style={styles.paceLabel}>/km 평균 페이스</Text>
        </View>
      )}

      <Text style={styles.label}>날짜</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholderTextColor={colors.textMuted} />

      <Text style={styles.label}>거리 (km)</Text>
      <TextInput style={styles.input} placeholder="10.5" placeholderTextColor={colors.textMuted}
        value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad" />

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

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>평균 심박수</Text>
          <TextInput style={styles.input} placeholder="150" placeholderTextColor={colors.textMuted}
            value={avgHr} onChangeText={setAvgHr} keyboardType="number-pad" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>추정 칼로리</Text>
          <TextInput style={styles.input} placeholder={estCalories ? String(estCalories) : '0'}
            placeholderTextColor={colors.textMuted} value={calories} onChangeText={setCalories} keyboardType="number-pad" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>케이던스 (spm)</Text>
          <TextInput style={styles.input} placeholder="180" placeholderTextColor={colors.textMuted}
            value={cadence} onChangeText={setCadence} keyboardType="number-pad" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>등반 고도 (m)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted}
            value={elevation} onChangeText={setElevation} keyboardType="decimal-pad" />
        </View>
      </View>

      <Text style={styles.label}>노면</Text>
      <View style={styles.chips}>
        {SURFACES.map(s => (
          <TouchableOpacity key={s.value} style={[styles.chip, surface === s.value && styles.chipActive]} onPress={() => setSurface(s.value)}>
            <Text style={[styles.chipText, surface === s.value && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>오늘 컨디션</Text>
      <FeelingSelector value={feeling} onChange={setFeeling} />

      <Text style={styles.label}>메모 (선택)</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="훈련 내용, 느낌은 점..."
        placeholderTextColor={colors.textMuted} value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '훈련 저장'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 4 },
  backText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  pacePreview: { backgroundColor: colors.running + '22', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 },
  paceValue: { color: colors.running, fontSize: 32, fontWeight: '800' },
  paceLabel: { color: colors.textSecondary, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  half: { flex: 1 },
  timeSep: { color: colors.text, fontSize: 20, fontWeight: '700', paddingBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.running, borderColor: colors.running },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
