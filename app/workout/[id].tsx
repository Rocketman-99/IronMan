import { useEffect, useState } from 'react';
import { MarkdownText } from '../../src/components/common/MarkdownText';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors, sportColors } from '../../src/utils/theme';
import { t, sportLabels, feelingLabels } from '../../src/i18n/ko';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { formatWorkoutDate, formatDuration, formatDistanceKm, formatSwimDistance, formatPace, calcSpeedKmh } from '../../src/utils/formatters';
import { type WorkoutWithDetails } from '../../src/types';
import { getWorkoutById } from '../../src/db/queries/workouts';
import { surfaceLabel, strokeLabel, bikeTypeLabel } from '../../src/utils/constants';

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

  /**
   * 이 화면은 기록 저장 직후·히스토리·성장 그래프·딥링크 등 여러 경로로 열린다.
   * 그중 하나라도 스택에 아래가 없으면 뒤로가기가 먹히지 않아 화면에 갇힌다
   * (예전에 저장 직후 replace 를 쓰다 실제로 그랬다). 그때는 대시보드로 보낸다.
   */
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)');
  }

  async function handleDelete() {
    Alert.alert(
      t.workoutDetail.deleteTitle,
      t.workoutDetail.deleteConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.common.delete, style: 'destructive', onPress: async () => {
          await deleteWorkout(db, Number(id));
          goBack();
        }},
      ]
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (!workout) return <View style={styles.center}><Text style={styles.notFound}>{t.workoutDetail.notFound}</Text></View>;

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
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
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
          <Text style={styles.metricLabel}>{t.log.distance}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{formatDuration(workout.duration_sec)}</Text>
          <Text style={styles.metricLabel}>{t.log.duration}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{getSecondary()}</Text>
          <Text style={styles.metricLabel}>
            {workout.sport_type === 'running' ? t.log.pace : workout.sport_type === 'cycling' ? t.log.speed : '-'}
          </Text>
        </View>
      </View>

      {(workout.avg_hr || workout.calories || workout.feeling) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.log.extraInfo}</Text>
          {workout.avg_hr && <Text style={styles.infoRow}>{t.workoutDetail.avgHr}: {workout.avg_hr} bpm</Text>}
          {workout.calories && <Text style={styles.infoRow}>{t.workoutDetail.calories}: {workout.calories} kcal</Text>}
          {workout.feeling && <Text style={styles.infoRow}>{t.workoutDetail.condition}: {feelingLabels[workout.feeling]}</Text>}
        </View>
      )}

      {workout.sport_type === 'running' && workout.running && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.workoutDetail.runningDetail}</Text>
          {workout.running.cadence_spm && <Text style={styles.infoRow}>{t.workoutDetail.cadence}: {workout.running.cadence_spm} spm</Text>}
          {workout.running.elevation_gain_m && <Text style={styles.infoRow}>{t.workoutDetail.elevation}: {workout.running.elevation_gain_m}m</Text>}
          {workout.running.surface && <Text style={styles.infoRow}>{t.workoutDetail.surface}: {surfaceLabel(workout.running.surface)}</Text>}
        </View>
      )}

      {workout.sport_type === 'swimming' && workout.swimming && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.workoutDetail.swimmingDetail}</Text>
          {workout.swimming.pool_length_m && <Text style={styles.infoRow}>{t.workoutDetail.pool}: {workout.swimming.pool_length_m}m</Text>}
          {workout.swimming.total_laps && <Text style={styles.infoRow}>{t.workoutDetail.laps}: {workout.swimming.total_laps}</Text>}
          {workout.swimming.stroke_type && <Text style={styles.infoRow}>{t.workoutDetail.stroke}: {strokeLabel(workout.swimming.stroke_type)}</Text>}
        </View>
      )}

      {workout.sport_type === 'cycling' && workout.cycling && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.workoutDetail.cyclingDetail}</Text>
          {workout.cycling.avg_power_w && <Text style={styles.infoRow}>{t.workoutDetail.avgPower}: {workout.cycling.avg_power_w}W</Text>}
          {workout.cycling.avg_cadence_rpm && <Text style={styles.infoRow}>{t.workoutDetail.cadence}: {workout.cycling.avg_cadence_rpm} rpm</Text>}
          {workout.cycling.elevation_gain_m && <Text style={styles.infoRow}>{t.workoutDetail.elevation}: {workout.cycling.elevation_gain_m}m</Text>}
          {workout.cycling.bike_type && <Text style={styles.infoRow}>{t.workoutDetail.bikeType}: {bikeTypeLabel(workout.cycling.bike_type)}</Text>}
        </View>
      )}

      {workout.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.log.notes}</Text>
          <Text style={styles.notes}>{workout.notes}</Text>
        </View>
      ) : null}

      {aiData && (
        <View style={[styles.section, styles.aiSection]}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={16} color={colors.gold} />
            <Text style={styles.aiTitle}>{t.workoutDetail.aiTitle}</Text>
          </View>
          {aiData.summary && <MarkdownText style={styles.aiText}>{aiData.summary}</MarkdownText>}
          {aiData.highlights?.length > 0 && (
            <>
              <Text style={styles.aiSubTitle}>{t.workoutDetail.highlights}</Text>
              {aiData.highlights.map((h: string, i: number) => <Text key={i} style={styles.aiItem}>• {h}</Text>)}
            </>
          )}
          {aiData.improvements?.length > 0 && (
            <>
              <Text style={styles.aiSubTitle}>{t.workoutDetail.improvements}</Text>
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
