import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { getWorkoutById } from '../../../src/db/queries/workouts';
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import { type WorkoutWithDetails, type PostWorkoutAnalysis } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { Card } from '../../../src/components/common/Card';
import { MetricRow } from '../../../src/components/common/MetricRow';
import { colors, sportColors, sportLabels, feelingEmojis, feelingLabels } from '../../../src/utils/theme';
import {
  formatWorkoutDate, formatDuration, formatDistanceKm, formatSwimDistance,
  formatPace, formatSwimPace,
} from '../../../src/utils/formatters';

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { deleteWorkout } = useWorkoutStore();
  const [workout, setWorkout] = useState<WorkoutWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    const w = await getWorkoutById(db, parseInt(id));
    setWorkout(w);
    setLoading(false);
  }

  async function handleDelete() {
    Alert.alert('삭제', '이 운동 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          await deleteWorkout(db, parseInt(id));
          router.back();
        },
      },
    ]);
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );

  if (!workout) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>기록을 찾을 수 없습니다</Text>
    </View>
  );

  const sportColor = sportColors[workout.sport_type as keyof typeof sportColors];
  const aiAnalysis: PostWorkoutAnalysis | null = workout.ai_analysis
    ? (() => { try { return JSON.parse(workout.ai_analysis) as PostWorkoutAnalysis; } catch { return null; } })()
    : null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={sportLabels[workout.sport_type as keyof typeof sportLabels]}
        showBack
        rightElement={
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>{formatWorkoutDate(workout.workout_date)}</Text>

        <View style={styles.heroRow}>
          <HeroMetric
            label="거리"
            value={workout.sport_type === 'swimming'
              ? formatSwimDistance(workout.distance_m)
              : formatDistanceKm(workout.distance_m)}
            color={sportColor}
          />
          <HeroMetric label="시간" value={formatDuration(workout.duration_sec)} />
          {workout.sport_type === 'running' && workout.running?.avg_pace_sec_km && (
            <HeroMetric label="페이스" value={formatPace(workout.running.avg_pace_sec_km)} />
          )}
          {workout.sport_type === 'cycling' && workout.cycling?.avg_speed_kmh && (
            <HeroMetric label="속도" value={`${workout.cycling.avg_speed_kmh} km/h`} />
          )}
          {workout.sport_type === 'swimming' && workout.swimming?.avg_pace_sec_100m && (
            <HeroMetric label="100m 페이스" value={formatSwimPace(workout.swimming.avg_pace_sec_100m)} />
          )}
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>세부 기록</Text>
          {workout.avg_hr && <MetricRow label="평균 심박수" value={`${workout.avg_hr} bpm`} />}
          {workout.max_hr && <MetricRow label="최대 심박수" value={`${workout.max_hr} bpm`} />}
          {workout.calories && <MetricRow label="소모 칼로리" value={`${workout.calories} kcal`} />}
          {workout.temp_celsius !== null && <MetricRow label="기온" value={`${workout.temp_celsius}°C`} />}
          {workout.humidity_pct !== null && <MetricRow label="습도" value={`${workout.humidity_pct}%`} />}

          {workout.sport_type === 'running' && workout.running && (
            <>
              {workout.running.cadence_spm && <MetricRow label="케이던스" value={`${workout.running.cadence_spm} spm`} />}
              {workout.running.elevation_gain_m !== null && <MetricRow label="고도 상승" value={`${workout.running.elevation_gain_m} m`} />}
              {workout.running.surface && <MetricRow label="노면" value={workout.running.surface} />}
            </>
          )}
          {workout.sport_type === 'swimming' && workout.swimming && (
            <>
              {workout.swimming.pool_length_m && <MetricRow label="수영장 길이" value={`${workout.swimming.pool_length_m} m`} />}
              {workout.swimming.total_laps && <MetricRow label="총 랩" value={`${workout.swimming.total_laps}회`} />}
              {workout.swimming.stroke_type && <MetricRow label="영법" value={workout.swimming.stroke_type} />}
              {workout.swimming.stroke_rate && <MetricRow label="스트로크율" value={`${workout.swimming.stroke_rate} spm`} />}
            </>
          )}
          {workout.sport_type === 'cycling' && workout.cycling && (
            <>
              {workout.cycling.avg_power_w && <MetricRow label="평균 파워" value={`${workout.cycling.avg_power_w} W`} />}
              {workout.cycling.avg_cadence_rpm && <MetricRow label="케이던스" value={`${workout.cycling.avg_cadence_rpm} rpm`} />}
              {workout.cycling.elevation_gain_m !== null && <MetricRow label="고도 상승" value={`${workout.cycling.elevation_gain_m} m`} />}
              {workout.cycling.bike_type && <MetricRow label="바이크" value={workout.cycling.bike_type} />}
            </>
          )}

          {workout.feeling && (
            <MetricRow
              label="느낌"
              value={`${feelingEmojis[workout.feeling as keyof typeof feelingEmojis]} ${feelingLabels[workout.feeling as keyof typeof feelingLabels]}`}
            />
          )}
        </Card>

        {workout.notes && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>메모</Text>
            <Text style={styles.notes}>{workout.notes}</Text>
          </Card>
        )}

        {aiAnalysis && (
          <Card style={[styles.card, styles.aiCard]}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={16} color={colors.gold} />
              <Text style={styles.aiTitle}>AI 코치 분석</Text>
            </View>
            <Text style={styles.aiHeadline}>{aiAnalysis.headline}</Text>
            <Text style={styles.aiText}>{aiAnalysis.performance}</Text>
            <View style={styles.aiSection}>
              <Text style={styles.aiLabel}>회복</Text>
              <Text style={styles.aiText}>{aiAnalysis.recovery}</Text>
            </View>
            <View style={styles.aiSection}>
              <Text style={styles.aiLabel}>다음 포인트</Text>
              <Text style={styles.aiText}>{aiAnalysis.nextFocus}</Text>
            </View>
            {aiAnalysis.warning && (
              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={14} color={colors.warning} />
                <Text style={styles.warningText}>{aiAnalysis.warning}</Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function HeroMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.hero}>
      <Text style={[styles.heroValue, color ? { color } : undefined]}>{value}</Text>
      <Text style={styles.heroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorText: { color: colors.textSecondary },
  content: { padding: 16, paddingBottom: 40 },
  date: { color: colors.textSecondary, fontSize: 14, marginBottom: 16 },
  heroRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 14, gap: 8 },
  hero: { flex: 1, alignItems: 'center' },
  heroValue: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  heroLabel: { color: colors.textMuted, fontSize: 11 },
  card: { marginBottom: 14 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  notes: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  aiCard: { borderWidth: 1, borderColor: colors.gold + '30', backgroundColor: '#120F00' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiTitle: { color: colors.gold, fontSize: 13, fontWeight: '600' },
  aiHeadline: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  aiSection: { marginTop: 10 },
  aiLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  aiText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: colors.warning + '20', borderRadius: 8, padding: 10, marginTop: 10,
  },
  warningText: { flex: 1, color: colors.warning, fontSize: 13, lineHeight: 18 },
});
