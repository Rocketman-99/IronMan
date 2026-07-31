import { useEffect, useState, useCallback } from 'react';
import { t } from '../../../src/i18n/ko';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { colors, sportColors } from '../../../src/utils/theme';
import { sportLabels } from '../../../src/i18n/ko';
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import {
  formatWorkoutDate,
  formatDistanceKm,
  formatDuration,
} from '../../../src/utils/formatters';
import { type WorkoutWithDetails } from '../../../src/types';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 48;

type Tab = 'volume' | 'pace' | 'hr';

export default function Progress() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { recentWorkouts, refreshAll, isLoading } = useWorkoutStore();
  const [tab, setTab] = useState<Tab>('volume');
  /** 그래프에서 선택한 점에 대응하는 운동. 아래 카드로 보여준다. */
  const [selected, setSelected] = useState<WorkoutWithDetails | null>(null);

  const load = useCallback(() => refreshAll(db), [db]);
  useEffect(() => { load(); }, []);

  // 탭을 바꾸면 이전 탭에서 고른 점은 의미가 없다.
  useEffect(() => { setSelected(null); }, [tab]);

  const TABS: { value: Tab; label: string }[] = [
    { value: 'volume', label: t.progress.volume },
    { value: 'pace', label: t.log.avgPaceShort },
    { value: 'hr', label: t.log.heartRate },
  ];

  // 각 계열은 차트에 넘길 데이터와, 인덱스로 되짚을 원본 운동을 나란히 들고 있는다.
  const volumeSource = recentWorkouts.slice(0, 7).reverse();
  const volumeData = volumeSource.map(w => ({
    value: Math.round(w.distance_m / 100) / 10,
    frontColor: sportColors[w.sport_type as keyof typeof sportColors],
    label: w.workout_date.slice(5, 10),
  }));

  const paceSource = recentWorkouts
    .filter(w => w.sport_type === 'running' && w.running?.avg_pace_sec_km)
    .slice(0, 10)
    .reverse();
  const paceData = paceSource.map(w => ({
    value: Number((w.running!.avg_pace_sec_km! / 60).toFixed(2)),
    dataPointText: '',
    label: w.workout_date.slice(5, 10),
  }));

  const hrSource = recentWorkouts.filter(w => w.avg_hr).slice(0, 10).reverse();
  const hrData = hrSource.map(w => ({
    value: w.avg_hr!,
    dataPointText: '',
    label: w.workout_date.slice(5, 10),
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>{t.progress.title}</Text>

      <View style={styles.tabRow}>
        {TABS.map(item => (
          <TouchableOpacity key={item.value} style={[styles.tab, tab === item.value && styles.tabActive]} onPress={() => setTab(item.value)}>
            <Text style={[styles.tabText, tab === item.value && styles.tabTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'volume' && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t.progress.distanceChart}</Text>
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
              onPress={(_item: unknown, index: number) => setSelected(volumeSource[index] ?? null)}
            />
          ) : <Text style={styles.noData}>{t.common.noData}</Text>}
        </View>
      )}

      {tab === 'pace' && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t.progress.paceChart}</Text>
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
              focusEnabled
              onFocus={(_item: unknown, index: number) => setSelected(paceSource[index] ?? null)}
            />
          ) : <Text style={styles.noData}>{t.progress.needRunning}</Text>}
        </View>
      )}

      {tab === 'hr' && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t.progress.hrChart}</Text>
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
              focusEnabled
              onFocus={(_item: unknown, index: number) => setSelected(hrSource[index] ?? null)}
            />
          ) : <Text style={styles.noData}>{t.progress.needHr}</Text>}
        </View>
      )}

      {selected ? (
        <TouchableOpacity
          style={[styles.selectedCard, { borderLeftColor: sportColors[selected.sport_type as keyof typeof sportColors] }]}
          onPress={() => router.push(`/workout/${selected.id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.selectedTop}>
            <Text style={[styles.selectedSport, { color: sportColors[selected.sport_type as keyof typeof sportColors] }]}>
              {sportLabels[selected.sport_type as keyof typeof sportLabels]}
            </Text>
            <Text style={styles.selectedDate}>{formatWorkoutDate(selected.workout_date)}</Text>
          </View>
          <Text style={styles.selectedMetrics}>
            {formatDistanceKm(selected.distance_m)} · {formatDuration(selected.duration_sec)}
            {selected.avg_hr ? ` · ${selected.avg_hr} bpm` : ''}
          </Text>
          <View style={styles.selectedLink}>
            <Text style={styles.selectedLinkText}>{t.progress.viewWorkout}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={styles.tapHint}>{t.progress.tapHint}</Text>
      )}

      <Text style={styles.sectionTitle}>{t.progress.sportBreakdown}</Text>
      {(['running', 'swimming', 'cycling'] as const).map(sport => {
        const count = recentWorkouts.filter(w => w.sport_type === sport).length;
        if (count === 0) return null;
        return (
          <View key={sport} style={[styles.sportRow, { borderLeftColor: sportColors[sport] }]}>
            <Text style={[styles.sportName, { color: sportColors[sport] }]}>
              {sportLabels[sport]}
            </Text>
            <Text style={styles.sportCount}>{count}{t.common.countUnit}</Text>
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
  chartCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder },
  chartTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  noData: { color: colors.textMuted, textAlign: 'center', paddingVertical: 32, fontSize: 14 },
  tapHint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 16 },
  selectedCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 3 },
  selectedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  selectedSport: { fontWeight: '700', fontSize: 14 },
  selectedDate: { color: colors.textSecondary, fontSize: 12 },
  selectedMetrics: { color: colors.text, fontSize: 15, fontWeight: '600' },
  selectedLink: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
  selectedLinkText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  sportRow: { backgroundColor: colors.card, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 3, borderWidth: 1, borderColor: colors.cardBorder },
  sportName: { fontWeight: '700', fontSize: 14 },
  sportCount: { color: colors.text, fontWeight: '800', fontSize: 16 },
});
