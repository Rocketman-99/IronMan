import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import { useProfileStore } from '../../../src/stores/profileStore';
import { useAppStore } from '../../../src/stores/appStore';
import { FeelingSelector } from '../../../src/components/workout/FeelingSelector';
import { Button } from '../../../src/components/common/Button';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { colors } from '../../../src/utils/theme';
import { BIKE_TYPES } from '../../../src/utils/constants';
import { getTodayKST, calcSpeedKmh, estimateCalories } from '../../../src/utils/formatters';
import { analyzeWorkout } from '../../../src/services/ai/postWorkoutAnalysis';
import { getWorkoutById, getWorkoutsBySport } from '../../../src/db/queries/workouts';

export default function CyclingLog() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveWorkout, updateAIAnalysis } = useWorkoutStore();
  const { profile } = useProfileStore();
  const { checkAndIncrementAIUsage } = useAppStore();
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(getTodayKST());
  const [distanceKm, setDistanceKm] = useState('');
  const [durationHH, setDurationHH] = useState('0');
  const [durationMM, setDurationMM] = useState('');
  const [durationSS, setDurationSS] = useState('0');
  const [avgHR, setAvgHR] = useState('');
  const [avgPower, setAvgPower] = useState('');
  const [cadence, setCadence] = useState('');
  const [elevation, setElevation] = useState('');
  const [tempC, setTempC] = useState('');
  const [bikeType, setBikeType] = useState('road');
  const [feeling, setFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  function getDurationSec(): number {
    return (parseInt(durationHH) || 0) * 3600 +
      (parseInt(durationMM) || 0) * 60 +
      (parseInt(durationSS) || 0);
  }

  async function handleSave() {
    const distM = (parseFloat(distanceKm) || 0) * 1000;
    const durSec = getDurationSec();
    if (distM <= 0) return Alert.alert('거리를 입력해주세요');
    if (durSec <= 0) return Alert.alert('시간을 입력해주세요');

    setSaving(true);
    try {
      const avgSpeed = calcSpeedKmh(distM, durSec);
      const estimatedCal = profile?.weight_kg
        ? estimateCalories('cycling', durSec, profile.weight_kg)
        : undefined;

      const id = await saveWorkout(db, {
        sport_type: 'cycling',
        workout_date: date,
        duration_sec: durSec,
        distance_m: distM,
        calories: estimatedCal,
        avg_hr: avgHR ? parseInt(avgHR) : undefined,
        feeling: feeling ?? undefined,
        notes: notes || undefined,
        temp_celsius: tempC ? parseFloat(tempC) : undefined,
        cycling: {
          avg_speed_kmh: avgSpeed,
          avg_power_w: avgPower ? parseInt(avgPower) : undefined,
          avg_cadence_rpm: cadence ? parseInt(cadence) : undefined,
          elevation_gain_m: elevation ? parseFloat(elevation) : undefined,
          bike_type: bikeType,
        },
      });

      if (profile && checkAndIncrementAIUsage(0.5)) {
        (async () => {
          try {
            const workout = await getWorkoutById(db, id);
            const recentSame = await getWorkoutsBySport(db, 'cycling', 4);
            if (workout) {
              const analysis = await analyzeWorkout(workout, recentSame.filter(w => w.id !== id), profile);
              await updateAIAnalysis(db, id, JSON.stringify(analysis));
            }
          } catch {}
        })();
      }

      Alert.alert('저장 완료!', '사이클 기록이 저장되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="🚴 사이클 기록" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Field label="날짜">
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label="거리 (km) *">
          <TextInput style={styles.input} value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad" placeholder="40.0" placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label="시간 (시:분:초) *">
          <View style={styles.timeRow}>
            <TextInput style={[styles.input, styles.timeInput]} value={durationHH} onChangeText={setDurationHH} keyboardType="number-pad" placeholder="1" placeholderTextColor={colors.textMuted} maxLength={2} />
            <Text style={styles.timeSep}>:</Text>
            <TextInput style={[styles.input, styles.timeInput]} value={durationMM} onChangeText={setDurationMM} keyboardType="number-pad" placeholder="30" placeholderTextColor={colors.textMuted} maxLength={2} />
            <Text style={styles.timeSep}>:</Text>
            <TextInput style={[styles.input, styles.timeInput]} value={durationSS} onChangeText={setDurationSS} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} maxLength={2} />
          </View>
        </Field>

        <View style={styles.row}>
          <View style={styles.half}>
            <Field label="평균 심박수 (bpm)">
              <TextInput style={styles.input} value={avgHR} onChangeText={setAvgHR} keyboardType="number-pad" placeholder="145" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={styles.half}>
            <Field label="평균 파워 (W)">
              <TextInput style={styles.input} value={avgPower} onChangeText={setAvgPower} keyboardType="number-pad" placeholder="200" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Field label="케이던스 (rpm)">
              <TextInput style={styles.input} value={cadence} onChangeText={setCadence} keyboardType="number-pad" placeholder="90" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={styles.half}>
            <Field label="고도 상승 (m)">
              <TextInput style={styles.input} value={elevation} onChangeText={setElevation} keyboardType="decimal-pad" placeholder="500" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
        </View>

        <Field label="기온 (°C)">
          <TextInput style={styles.input} value={tempC} onChangeText={setTempC} keyboardType="decimal-pad" placeholder="22" placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label="바이크 종류">
          <View style={styles.chips}>
            {BIKE_TYPES.map((b) => (
              <TouchableOpacity
                key={b.value}
                style={[styles.chip, bikeType === b.value && styles.chipActive]}
                onPress={() => setBikeType(b.value)}
              >
                <Text style={[styles.chipText, bikeType === b.value && styles.chipTextActive]}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <View style={styles.feelingWrap}>
          <FeelingSelector value={feeling} onChange={setFeeling} />
        </View>

        <Field label="메모">
          <TextInput style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder="오늘 훈련 메모..." placeholderTextColor={colors.textMuted} />
        </Field>

        <Button label="저장하기" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 14 },
  fieldLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 13, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
  textarea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: { flex: 1, textAlign: 'center' },
  timeSep: { color: colors.textSecondary, fontSize: 18, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { borderColor: colors.cycling, backgroundColor: '#0A1A0A' },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: colors.cycling, fontWeight: '600' },
  feelingWrap: { marginBottom: 14 },
  saveBtn: { marginTop: 8, borderRadius: 14 },
});
