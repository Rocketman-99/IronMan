import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors, sportColors, sportLabels } from '../../../src/utils/theme';
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import { formatWorkoutDate, formatDuration, formatDistanceKm, formatSwimDistance, formatPace, calcSpeedKmh } from '../../../src/utils/formatters';
import { type WorkoutWithDetails } from '../../../src/types';
import { getWorkoutById } from '../../../src/db/queries/workouts';

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { deleteWorkout } = useWorkoutStore();
  const [workout, setWorkout] = useState<WorkoutWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkoutById(db, Number(id)).then(w => { setWorkout(w); setLoading(false); });
  }, [id]);

  async function handleDelete() {
    Alert.alert(
      '운동 삭제',
      '이 운동 기록을 삭제하시가요?',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: async () => {
          await deleteWorkout(db, Number(id));
          router.back();
        }},
      ]
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (!workout) return <View style={styles.center}><Text style={styles.notFound}>운동을 찾을 수 없어요</Text></View>;

  const sportColor = sportColors[workout.sport_type as keyof typeof sportColors];

  function getPrimary() {
    if (workout!.sport_type === 'swimming') return formatSwimDistance(workout!.distance_m);
    return formatDistanceKm(workout!.distance_m);
  }

  function getSecondary() {
    if (workout!.sport_type === 'running' && workout!.running?.avg_pace_sec_km) return formatPace(workout!.running.avg_pace_sec_km);
    if (workout!.sport_type === 'cycling') {
      const s = workout!.cycling?.avg_speed_kmh ?? calcSpeedKmh(workout!.distance_m, workout!.duration_sec);
      return `${s} km/h`;
    }
    return '--';
  }

  let aiData: any = null;
  try { if (workout.ai_analysis) aiData = JSON.parse(workout.ai_analysis); } catch {}

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={[styles.sportBar, { backgroundColor: sportColor + '22', borderLeftColor: sportColor }]}>
        <Text style={[styles.sportName, { color: sportColor }]}>
          {sportLabels[workout.sport_type as keyof typeof sportLabels]}
        </Text>
        <Text style={styles.date}>{formatWorkoutDate(workout.workout_date)}</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{getPrimary()}</Text>
          <Text style={styles.metricLabel}>거리</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{formatDuration(workout.duration_sec)}</Text>
          <Text style={styles.metricLabel}>시간</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{getSecondary()}</Text>
          <Text style={styles.metricLabel}>
            {workout.sport_type === 'running' ? '페이스' : workout.sport_type === 'cycling' ? '속도' : '-'}
          </Text>
        </View>
      </View>

      {(workout.avg_hr || workout.calories || workout.feeling) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>추가 정보</Text>
          {workout.avg_hr && <Text style={styles.infoRow}>평균 심박수: {workout.avg_hr} bpm</Text>}
          {workout.calories && <Text style={styles.infoRow}>칼로리: {workout.calories} kcal</Text>}
          {workout.feeling && <Text style={styles.infoRow}>컨디션: {['', '힌들었음', '쿈쿈함', '보통', '좋았음', '최고!'][workout.feeling]}</Text>}
        </View>
      )}

      {workout.sport_type === 'running' && workout.running && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>러닝 세부 정보</Text>
          {workout.running.cadence_spm && <Text style={styles.infoRow}>케이던스: {workout.running.cadence_spm} spm</Text>}
          {workout.running.elevation_gain_m && <Text style={styles.infoRow}>등반 고도: {workout.running.elevation_gain_m}m</Text>}
          {workout.running.surface && <Text style={styles.infoRow}>노면: {workout.running.surface}</Text>}
        </View>
      )}

      {workout.sport_type === 'swimming' && workout.swimming && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수영 세부 정보</Text>
          {workout.swimming.pool_length_m && <Text style={styles.infoRow}>수영장: {workout.swimming.pool_length_m}m</Text>}
          {workout.swimming.total_laps && <Text style={styles.infoRow}>랩 수: {workout.swimming.total_laps}</Text>}
          {workout.swimming.stroke_type && <Text style={styles.infoRow}>영법: {workout.swimming.stroke_type}</Text>}
        </View>
      )}

      {workout.sport_type === 'cycling' && workout.cycling && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사이클 세부 정보</Text>
          {workout.cycling.avg_power_w && <Text style={styles.infoRow}>평균 파워: {workout.cycling.avg_power_w}W</Text>}
          {workout.cycling.avg_cadence_rpm && <Text style={styles.infoRow}>케이던스: {workout.cycling.avg_cadence_rpm} rpm</Text>}
          {workout.cycling.elevation_gain_m && <Text style={styles.infoRow}>등반 고도: {workout.cycling.elevation_gain_m}m</Text>}
        </View>
      )}

      {workout.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>메모</Text>
          <Text style={styles.notes}>{workout.notes}</Text>
        </View>
      ) : null}

      {aiData && (
        <View style={[styles.section, styles.aiSection]}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={16} color={colors.gold} />
            <Text style={styles.aiTitle}>AI 코치 분석</Text>
          </View>
          {aiData.summary && <Text style={styles.aiText}>{aiData.summary}</Text>}
          {aiData.highlights?.length > 0 && (
            <>
              <Text style={styles.aiSubTitle}>하이라이트</Text>
              {aiData.highlights.map((h: string, i: number) => <Text key={i} style={styles.aiItem}>• {h}</Text>)}
            </>
          )}
          {aiData.improvements?.length > 0 && (
            <>
              <Text style={styles.aiSubTitle}>개선 포인트</Text>
              {aiData.improvements.map((h: string, i: number) => <Text key={i} style={styles.aiItem}>• {h}</Text>)}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: colors.textSecondary, fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  sportBar: { borderRadius: 12, padding: 14, borderLeftWidth: 4, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sportName: { fontSize: 18, fontWeight: '800' },
  date: { color: colors.textSecondary, fontSize: 13 },
  metricsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  metricValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  metricLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  section: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder },
  sectionTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { color: colors.text, fontSize: 14, marginBottom: 4 },
  notes: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  aiSection: { borderLeftWidth: 3, borderLeftColor: colors.gold },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiTitle: { color: colors.gold, fontWeight: '700', fontSize: 14 },
  aiText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  aiSubTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  aiItem: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
});
