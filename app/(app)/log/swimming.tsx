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
import { STROKE_TYPES } from '../../../src/utils/constants';
import { getTodayKST, estimateCalories } from '../../../src/utils/formatters';
import { analyzeWorkout } from '../../../src/services/ai/postWorkoutAnalysis';
import { getWorkoutById, getWorkoutsBySport } from '../../../src/db/queries/workouts';
import { useAIStore } from '../../../src/stores/aiStore';

export default function SwimmingLog() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveWorkout, updateAIAnalysis } = useWorkoutStore();
  const { profile } = useProfileStore();
  const { checkAndIncrementAIUsage } = useAppStore();
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(getTodayKST());
  const [totalM, setTotalM] = useState('');
  const [poolLength, setPoolLength] = useState<25 | 50>(25);
  const [durationMM, setDurationMM] = useState('');
  const [durationSS, setDurationSS] = useState('0');
  const [avgHR, setAvgHR] = useState('');
  const [strokeType, setStrokeType] = useState('freestyle');
  const [strokeRate, setStrokeRate] = useState('');
  const [feeling, setFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  function getDurationSec(): number {
    return (parseInt(durationMM) || 0) * 60 + (parseInt(durationSS) || 0);
  }

  async function handleSave() {
    const distM = parseInt(totalM) || 0;
    const durSec = getDurationSec();

    if (distM <= 0) return Alert.alert('거리를 입력해주세요');
    if (durSec <= 0) return Alert.alert('시간을 입력해주세요');

    setSaving(true);
    try {
      const totalLaps = Math.round(distM / poolLength);
      const avgPace100m = Math.round(durSec / (distM / 100));
      const estimatedCal = profile?.weight_kg
        ? estimateCalories('swimming', durSec, profile.weight_kg)
        : undefined;

      const id = await saveWorkout(db, {
        sport_type: 'swimming',
        workout_date: date,
        duration_sec: durSec,
        distance_m: distM,
        calories: estimatedCal,
        avg_hr: avgHR ? parseInt(avgHR) : undefined,
        feeling: feeling ?? undefined,
        notes: notes || undefined,
        swimming: {
          pool_length_m: poolLength,
          total_laps: totalLaps,
          avg_pace_sec_100m: avgPace100m,
          stroke_type: strokeType,
          stroke_rate: strokeRate ? parseInt(strokeRate) : undefined,
        },
      });

      if (profile && checkAndIncrementAIUsage(0.5)) {
        (async () => {
          try {
            const workout = await getWorkoutById(db, id);
            const recentSame = await getWorkoutsBySport(db, 'swimming', 4);
            if (workout) {
              const analysis = await analyzeWorkout(workout, recentSame.filter(w => w.id !== id), profile);
              await updateAIAnalysis(db, id, JSON.stringify(analysis));
            }
          } catch {}
        })();
      }

      Alert.alert('저장 완료!', '수영 기록이 저장되었습니다.', [
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
      <ScreenHeader title="🏊 수영 기록" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Field label="날짜">
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label="수영장 길이">
          <View style={styles.chips}>
            {([25, 50] as const).map((len) => (
              <TouchableOpacity
                key={len}
                style={[styles.chip, poolLength === len && styles.chipActive]}
                onPress={() => setPoolLength(len)}
              >
                <Text style={[styles.chipText, poolLength === len && styles.chipTextActive]}>{len}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="총 거리 (m) *">
          <TextInput style={styles.input} value={totalM} onChangeText={setTotalM} keyboardType="number-pad" placeholder="1500" placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label="시간 (분:초) *">
          <View style={styles.timeRow}>
            <TextInput style={[styles.input, styles.timeInput]} value={durationMM} onChangeText={setDurationMM} keyboardType="number-pad" placeholder="30" placeholderTextColor={colors.textMuted} maxLength={3} />
            <Text style={styles.timeSep}>:</Text>
            <TextInput style={[styles.input, styles.timeInput]} value={durationSS} onChangeText={setDurationSS} keyboardType="number-pad" placeholder="00" placeholderTextColor={colors.textMuted} maxLength={2} />
          </View>
        </Field>

        <View style={styles.row}>
          <View style={styles.half}>
            <Field label="평균 심박수 (bpm)">
              <TextInput style={styles.input} value={avgHR} onChangeText={setAvgHR} keyboardType="number-pad" placeholder="140" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={styles.half}>
            <Field label="스트로크율 (spm)">
              <TextInput style={styles.input} value={strokeRate} onChangeText={setStrokeRate} keyboardType="number-pad" placeholder="28" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
        </View>

        <Field label="영법">
          <View style={styles.chips}>
            {STROKE_TYPES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.chip, strokeType === s.value && styles.chipActive]}
                onPress={() => setStrokeType(s.value)}
              >
                <Text style={[styles.chipText, strokeType === s.value && styles.chipTextActive]}>{s.label}</Text>
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
  chipActive: { borderColor: colors.swimming, backgroundColor: '#0A1020' },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: colors.swimming, fontWeight: '600' },
  feelingWrap: { marginBottom: 14 },
  saveBtn: { marginTop: 8, borderRadius: 14 },
});
