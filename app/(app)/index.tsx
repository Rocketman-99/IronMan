import { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors, sportColors, sportLabels } from '../../src/utils/theme';
import { useProfileStore } from '../../src/stores/profileStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useAIStore } from '../../src/stores/aiStore';
import { useAppStore } from '../../src/stores/appStore';
import { WorkoutCard } from '../../src/components/workout/WorkoutCard';
import { formatDuration, formatDistanceKm } from '../../src/utils/formatters';

export default function Dashboard() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { profile } = useProfileStore();
  const { recentWorkouts, weeklyStats, refreshAll, isLoading } = useWorkoutStore();
  const { dailyTip, fetchDailyTip } = useAIStore();
  const { hasApiKey } = useAppStore();

  const load = useCallback(async () => {
    await refreshAll(db);
    if (hasApiKey && !dailyTip) {
      fetchDailyTip(db, profile);
    }
  }, [db, hasApiKey, dailyTip, profile]);

  useEffect(() => { load(); }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return '좋은 아침';
    if (h < 18) return '안녕하세요';
    return '좋은 저녁';
  })();

  const totalDistanceM = (weeklyStats?.run_distance_m ?? 0) + (weeklyStats?.swim_distance_m ?? 0) + (weeklyStats?.bike_distance_m ?? 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}, {profile?.name ?? '트레이니'} 군! 🔥</Text>
          <Text style={styles.subGreeting}>오늘도 파이팅하게 훈련하세요</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(app)/settings')} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {weeklyStats && (
        <View style={styles.weeklyCard}>
          <Text style={styles.sectionTitle}>이번 주 훈련</Text>
          <View style={styles.weeklyGrid}>
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyValue}>{weeklyStats.workout_count}</Text>
              <Text style={styles.weeklyLabel}>운동 횟수</Text>
            </View>
            <View style={styles.weeklyDivider} />
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyValue}>{formatDuration(weeklyStats.total_duration_sec)}</Text>
              <Text style={styles.weeklyLabel}>연습 시간</Text>
            </View>
            <View style={styles.weeklyDivider} />
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyValue}>{formatDistanceKm(totalDistanceM)}</Text>
              <Text style={styles.weeklyLabel}>연습 거리</Text>
            </View>
          </View>
        </View>
      )}

      {dailyTip ? (
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={16} color={colors.gold} />
            <Text style={styles.tipTitle}>AI 코치의 오늘의 팁</Text>
          </View>
          <Text style={styles.tipText}>{dailyTip}</Text>
        </View>
      ) : !hasApiKey ? (
        <TouchableOpacity style={styles.setupCard} onPress={() => router.push('/(app)/settings')}>
          <Ionicons name="key-outline" size={20} color={colors.primary} />
          <Text style={styles.setupText}>API 키를 설정하면 AI 코치를 이용할 수 있어요</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/(app)/log')}>
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.logBtnText}>운동 기록하기</Text>
      </TouchableOpacity>

      <View style={styles.aiRow}>
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/(app)/ai/coach')}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
          <Text style={styles.aiCardText}>AI 코치</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/(app)/ai/injury')}>
          <Ionicons name="medkit-outline" size={24} color={colors.warning} />
          <Text style={styles.aiCardText}>부상 위험</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/(app)/ai/plan')}>
          <Ionicons name="calendar-outline" size={24} color={colors.success} />
          <Text style={styles.aiCardText}>훈련 계획</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/(app)/profile')}>
          <Ionicons name="person-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.aiCardText}>프로필</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>최근 운동</Text>
      {recentWorkouts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 운동 기록이 없어요</Text>
          <Text style={styles.emptySubText}>첫 번째 훈련을 기록해보세요! 🔥</Text>
        </View>
      ) : (
        recentWorkouts.slice(0, 3).map(w => <WorkoutCard key={w.id} workout={w} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingTop: 56, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  settingsBtn: { padding: 4 },
  weeklyCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 4 },
  weeklyGrid: { flexDirection: 'row', alignItems: 'center' },
  weeklyItem: { flex: 1, alignItems: 'center' },
  weeklyValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  weeklyLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  weeklyDivider: { width: 1, height: 36, backgroundColor: colors.divider, marginHorizontal: 8 },
  tipCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: colors.gold },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tipTitle: { color: colors.gold, fontWeight: '700', fontSize: 13 },
  tipText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  setupCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.cardBorder },
  setupText: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  logBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  logBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  aiRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  aiCard: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.cardBorder },
  aiCardText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  emptySubText: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
});
