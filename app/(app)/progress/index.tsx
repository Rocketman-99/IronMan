import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { getWorkoutsInRange } from '../../../src/db/queries/workouts';
import { type WorkoutWithDetails } from '../../../src/types';
import { colors, sportColors } from '../../../src/utils/theme';
import {
  getWeekStartKST, formatDateShort, formatPace,
} from '../../../src/utils/formatters';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 48;

type TabKey = 'volume' | 'pace' | 'hr';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'volume', label: '볼륨' },
  { key: 'pace', label: '페이스' },
  { key: 'hr', label: '심박수' },
];

export default function ProgressScreen() {
  const db = useSQLiteContext();
  const [tab, setTab] = useState<TabKey>('volume');
  const [workouts, setWorkouts] = useState<WorkoutWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const today = getWeekStartKST();
    const from = new Date(new Date(today + 'T00:00:00+09:00').getTime() - 55 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);
    const data = await getWorkoutsInRange(db, from, today);
    setWorkouts(data);
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>성장 분석</Text>
      </View>
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {tab === 'volume' && <VolumeChart workouts={workouts} />}
          {tab === 'pace' && <PaceChart workouts={workouts} />}
          {tab === 'hr' && <HRChart workouts={workouts} />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function VolumeChart({ workouts }: { workouts: WorkoutWithDetails[] }) {
  const weeklyData = buildWeeklyVolume(workouts);
  return (
    <View>
      <Text style={styles.chartTitle}>주간 러닝 거리 (km)</Text>
      {weeklyData.run.length > 0 ? (
        <BarChart data={weeklyData.run.map(d => ({ value: d.value, label: d.label, frontColor: colors.running }))} width={CHART_W} height={180} barWidth={CHART_W / (weeklyData.run.length * 2.2)} xAxisColor={colors.divider} yAxisColor={colors.divider} yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }} xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }} noOfSections={4} backgroundColor="transparent" />
      ) : <NoDataText />}
      <Text style={[styles.chartTitle, styles.chartTitleSpaced]}>주간 사이클 거리 (km)</Text>
      {weeklyData.bike.length > 0 ? (
        <BarChart data={weeklyData.bike.map(d => ({ value: d.value, label: d.label, frontColor: colors.cycling }))} width={CHART_W} height={180} barWidth={CHART_W / (weeklyData.bike.length * 2.2)} xAxisColor={colors.divider} yAxisColor={colors.divider} yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }} xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }} noOfSections={4} backgroundColor="transparent" />
      ) : <NoDataText />}
      <Text style={[styles.chartTitle, styles.chartTitleSpaced]}>주간 수영 거리 (m)</Text>
      {weeklyData.swim.length > 0 ? (
        <BarChart data={weeklyData.swim.map(d => ({ value: d.value, label: d.label, frontColor: colors.swimming }))} width={CHART_W} height={180} barWidth={CHART_W / (weeklyData.swim.length * 2.2)} xAxisColor={colors.divider} yAxisColor={colors.divider} yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }} xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }} noOfSections={4} backgroundColor="transparent" />
      ) : <NoDataText />}
    </View>
  );
}

function PaceChart({ workouts }: { workouts: WorkoutWithDetails[] }) {
  const runs = workouts.filter(w => w.sport_type === 'running' && w.running?.avg_pace_sec_km).sort((a, b) => a.workout_date.localeCompare(b.workout_date)).slice(-20);
  if (runs.length === 0) return <NoDataText />;
  const data = runs.map(w => ({ value: w.running!.avg_pace_sec_km! / 60, label: formatDateShort(w.workout_date), dataPointText: formatPace(w.running!.avg_pace_sec_km!) }));
  return (
    <View>
      <Text style={styles.chartTitle}>러닝 페이스 추이 (분/km)</Text>
      <LineChart data={data} width={CHART_W} height={200} color={colors.running} thickness={2} dataPointsColor={colors.running} xAxisColor={colors.divider} yAxisColor={colors.divider} yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }} xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }} hideDataPoints={runs.length > 10} curved areaChart startFillColor={colors.running + '30'} endFillColor="transparent" />
    </View>
  );
}

function HRChart({ workouts }: { workouts: WorkoutWithDetails[] }) {
  const withHR = workouts.filter(w => w.avg_hr).sort((a, b) => a.workout_date.localeCompare(b.workout_date)).slice(-20);
  if (withHR.length === 0) return <NoDataText />;
  const data = withHR.map(w => ({ value: w.avg_hr!, label: formatDateShort(w.workout_date), dataPointColor: sportColors[w.sport_type as keyof typeof sportColors] }));
  return (
    <View>
      <Text style={styles.chartTitle}>평균 심박수 추이 (bpm)</Text>
      <LineChart data={data} width={CHART_W} height={200} color={colors.primaryLight} thickness={2} xAxisColor={colors.divider} yAxisColor={colors.divider} yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }} xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }} curved />
    </View>
  );
}

function NoDataText() { return <Text style={styles.noData}>데이터가 충분하지 않습니다</Text>; }

function buildWeeklyVolume(workouts: WorkoutWithDetails[]) {
  const weeks: Record<string, { run: number; swim: number; bike: number }> = {};
  for (const w of workouts) {
    const week = getWeekStartKST(w.workout_date);
    if (!weeks[week]) weeks[week] = { run: 0, swim: 0, bike: 0 };
    if (w.sport_type === 'running') weeks[week].run += w.distance_m / 1000;
    else if (w.sport_type === 'swimming') weeks[week].swim += w.distance_m;
    else if (w.sport_type === 'cycling') weeks[week].bike += w.distance_m / 1000;
  }
  const sorted = Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b));
  return {
    run: sorted.map(([k, v]) => ({ label: formatDateShort(k), value: Math.round(v.run * 10) / 10 })),
    swim: sorted.map(([k, v]) => ({ label: formatDateShort(k), value: Math.round(v.swim) })),
    bike: sorted.map(([k, v]) => ({ label: formatDateShort(k), value: Math.round(v.bike * 10) / 10 })),
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  tabBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  tabBtnActive: { borderColor: colors.primary, backgroundColor: '#1A0808' },
  tabText: { color: colors.textSecondary, fontSize: 13 },
  tabTextActive: { color: colors.primaryLight, fontWeight: '600' },
  loader: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  chartTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  chartTitleSpaced: { marginTop: 24 },
  noData: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
});
