import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { colors, sportColors } from '../../../src/utils/theme';
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import { formatDistanceKm } from '../../../src/utils/formatters';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 48;

type Tab = 'volume' | 'pace' | 'hr';

export default function Progress() {
  const db = useSQLiteContext();
  const { recentWorkouts, refreshAll, isLoading } = useWorkoutStore();
  const [tab, setTab] = useState<Tab>('volume');

  const load = useCallback(() => refreshAll(db), [db]);
  useEffect(() => { load(); }, []);

  const TABS: { value: Tab; label: string }[] = [
    { value: 'volume', label: '볼륨' },
    { value: 'pace', label: '평균 페이스' },
    { value: 'hr', label: '심박수' },
  ];

  const runWorkouts = recentWorkouts.filter(w => w.sport_type === 'running').slice(0, 10).reverse();

  const volumeData = recentWorkouts.slice(0, 7).reverse().map(w => ({
    value: Math.round(w.distance_m / 100) / 10,
    frontColor: sportColors[w.sport_type as keyof typeof sportColors],
    label: w.workout_date.slice(5, 10),
  }));

  const paceData = runWorkouts
    .filter(w => w.running?.avg_pace_sec_km)
    .map(w => ({ value: Number((w.running!.avg_pace_sec_km! / 60).toFixed(2)), dataPointText: '', label: w.workout_date.slice(5, 10) }));

  const hrData = recentWorkouts.filter(w => w.avg_hr).slice(0, 10).reverse()
    .map(w => ({ value: w.avg_hr!, dataPointText: '', label: w.workout_date.slice(5, 10) }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>성장 분석</Text>

      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.value} style={[styles.tab, tab === t.value && styles.tabActive]} onPress={() => setTab(t.value)}>
            <Text style={[styles.tabText, tab === t.value && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'volume' && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>최근 7회 운동 거리 (km)</Text>
          {volumeData.length > 0 ? (
            <BarChart
              data={volumeData}
              width={CHART_W - 24}
              height={180}
              barWidth={32}
              spacing={8}
              noOfSections={4}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              backgroundColor={colors.card}
              yAxisColor={colors.divider}
              xAxisColor={colors.divider}
              hideRules
            />
          ) : <Text style={styles.noData}>데이터가 없습니다</Text>}
        </View>
      )}

      {tab === 'pace' && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>러닝 페이스 추세 (min/km)</Text>
          {paceData.length > 1 ? (
            <LineChart
              data={paceData}
              width={CHART_W - 24}
              height={180}
              color={colors.running}
              thickness={2}
              noOfSections={4}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              dataPointsColor={colors.running}
              startFillColor={colors.running + '44'}
              endFillColor={colors.running + '00'}
              areaChart
              backgroundColor={colors.card}
              yAxisColor={colors.divider}
              xAxisColor={colors.divider}
              hideRules
            />
          ) : <Text style={styles.noData}>러닝 기록이 부족합니다</Text>}
        </View>
      )}

      {tab === 'hr' && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>평균 심박수 추세 (bpm)</Text>
          {hrData.length > 1 ? (
            <LineChart
              data={hrData}
              width={CHART_W - 24}
              height={180}
              color={colors.primary}
              thickness={2}
              noOfSections={4}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              dataPointsColor={colors.primary}
              startFillColor={colors.primary + '44'}
              endFillColor={colors.primary + '00'}
              areaChart
              backgroundColor={colors.card}
              yAxisColor={colors.divider}
              xAxisColor={colors.divider}
              hideRules
            />
          ) : <Text style={styles.noData}>심박수 데이터가 부족합니다</Text>}
        </View>
      )}

      <Text style={styles.sectionTitle}>종목별 운동 수</Text>
      {(['running', 'swimming', 'cycling'] as const).map(sport => {
        const count = recentWorkouts.filter(w => w.sport_type === sport).length;
        if (count === 0) return null;
        return (
          <View key={sport} style={[styles.sportRow, { borderLeftColor: sportColors[sport] }]}>
            <Text style={[styles.sportName, { color: sportColors[sport] }]}>
              {sport === 'running' ? '러닝' : sport === 'swimming' ? '수영' : '사이클'}
            </Text>
            <Text style={styles.sportCount}>{count}회</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingTop: 56, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 16 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  chartCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.cardBorder },
  chartTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  noData: { color: colors.textMuted, textAlign: 'center', paddingVertical: 32, fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  sportRow: { backgroundColor: colors.card, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 3, borderWidth: 1, borderColor: colors.cardBorder },
  sportName: { fontWeight: '700', fontSize: 14 },
  sportCount: { color: colors.text, fontWeight: '800', fontSize: 16 },
});
