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
import { getTodayKST, calcSpeedKmh, estimateCalories } from '../../../src/utils/formatters';
import { BIKE_TYPES } from '../../../src/utils/constants';

export default function CyclingLog() {
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
  const [avgPower, setAvgPower] = useState('');
  const [avgCadence, setAvgCadence] = useState('');
  const [elevation, setElevation] = useState('');
  const [bikeType, setBikeType] = useState('road');
  const [calories, setCalories] = useState('');
  const [feeling, setFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const totalSec = (parseInt(durationMin) || 0) * 60 + (parseInt(durationSec) || 0);
  const distanceM = (parseFloat(distanceKm) || 0) * 1000;
  const speed = distanceM > 0 && totalSec > 0 ? calcSpeedKmh(distanceM, totalSec) : 0;
  const estCalories = distanceM > 0 && profile?.weight_kg ? estimateCalories('cycling', totalSec, profile.weight_kg) : 0;

  async function handleSave() {
    if (!distanceKm || !durationMin) { Alert.alert('오류', '거리와 시간을 입력하세요'); return; }
    setSaving(true);
    try {
      const workoutId = await saveWorkout(db, {
        sport_type: 'cycling',
        workout_date: date,
        duration_sec: totalSec,
        distance_m: distanceM,
        calories: calories ? parseInt(calories) : (estCalories || undefined),
        avg_hr: avgHr ? parseInt(avgHr) : undefined,
        feeling: feeling ?? undefined,
        notes: notes || undefined,
        cycling: {
          avg_speed_kmh: speed || undefined,
          avg_power_w: avgPower ? parseInt(avgPower) : undefined,
          avg_cadence_rpm: avgCadence ? parseInt(avgCadence) : undefined,
          elevation_gain_m: elevation ? parseFloat(elevation) : undefined,
          bike_type: bikeType,
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
        <Text style={styles.backText}>사이클 기록</Text>
      </TouchableOpacity>

      {speed > 0 && (
        <View style={styles.speedPreview}>
          <Text style={styles.speedValue}>{speed} km/h</Text>
          <Text style={styles.speedLabel}>평균 속도</Text>
        </View>
      )}

      <Text style={styles.label}>날짜</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholderTextColor={colors.textMuted} />

      <Text style={styles.label}>거리 (km)</Text>
      <TextInput style={styles.input} placeholder="40" placeholderTextColor={colors.textMuted}
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
          <TextInput style={styles.input} placeholder="140" placeholderTextColor={colors.textMuted}
            value={avgHr} onChangeText={setAvgHr} keyboardType="number-pad" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>평균 파워 (W)</Text>
          <TextInput style={styles.input} placeholder="200" placeholderTextColor={colors.textMuted}
            value={avgPower} onChangeText={setAvgPower} keyboardType="number-pad" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>케이던스 (rpm)</Text>
          <TextInput style={styles.input} placeholder="90" placeholderTextColor={colors.textMuted}
            value={avgCadence} onChangeText={setAvgCadence} keyboardType="number-pad" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>등반 고도 (m)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted}
            value={elevation} onChangeText={setElevation} keyboardType="decimal-pad" />
        </View>
      </View>

      <Text style={styles.label}>바이크 종류</Text>
      <View style={styles.chips}>
        {BIKE_TYPES.map(b => (
          <TouchableOpacity key={b.value} style={[styles.chip, bikeType === b.value && styles.chipActive]} onPress={() => setBikeType(b.value)}>
            <Text style={[styles.chipText, bikeType === b.value && styles.chipTextActive]}>{b.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
  speedPreview: { backgroundColor: colors.cycling + '22', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 },
  speedValue: { color: colors.cycling, fontSize: 32, fontWeight: '800' },
  speedLabel: { color: colors.textSecondary, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  half: { flex: 1 },
  timeSep: { color: colors.text, fontSize: 20, fontWeight: '700', paddingBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.cycling, borderColor: colors.cycling },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
