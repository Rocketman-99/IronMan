import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '../../src/stores/profileStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useAIStore } from '../../src/stores/aiStore';
import { useAppStore } from '../../src/stores/appStore';
import { WorkoutCard } from '../../src/components/workout/WorkoutCard';
import { EmptyState } from '../../src/components/common/EmptyState';
import { colors, sportLabels } from '../../src/utils/theme';
import { formatDistanceKm, formatSwimDistance, formatDuration, getTodayKST } from '../../src/utils/formatters';
import { getDailyTip } from '../../src/services/ai/dailyTip';

export default function Dashboard() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { profile } = useProfileStore();
  const { recentWorkouts, weeklyStats, isLoading, refreshAll } = useWorkoutStore();
  const { dailyTip, dailyTipDate, setDailyTip, setError } = useAIStore();
  const { hasApiKey, checkAndIncrementAIUsage } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [tipLoading, setTipLoading] = React.useState(false);

  useEffect(() => {
    refreshAll(db);
  }, []);

  useEffect(() => {
    fetchTipIfNeeded();
  }, [profile, hasApiKey, recentWorkouts.length]);

  async function fetchTipIfNeeded() {
    if (!profile || !hasApiKey) return;
    const today = getTodayKST();
    if (dailyTipDate === today) return;
    if (!checkAndIncrementAIUsage(0.5)) return;

    setTipLoading(true);
    try {
      const tip = await getDailyTip(profile, recentWorkouts);
      setDailyTip(tip, today);
    } catch (e) {
      setError(String(e));
    } finally {
      setTipLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll(db);
    setRefreshing(false);
  }, [db]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}, {profile?.name ?? ''}님 👋</Text>
          <Text style={styles.subGreeting}>이번 주 훈련 현황</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(app)/profile')} style={styles.profileBtn}>
          <Ionicons name="person-circle-outline" size={32} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weeklyCard}>
        <View style={styles.weeklyRow}>
          <WeeklyBubble
            emoji="🏃"
            label={sportLabels.running}
            value={formatDistanceKm(weeklyStats.run_distance_m)}
            color={colors.running}
          />
          <WeeklyBubble
            emoji="🏊"
            label={sportLabels.swimming}
            value={formatSwimDistance(weeklyStats.swim_distance_m)}
            color={colors.swimming}
          />
          <WeeklyBubble
            emoji="🚴"
            label={sportLabels.cycling}
            value={formatDistanceKm(weeklyStats.bike_distance_m)}
            color={colors.cycling}
          />
        </View>
        <View style={styles.weeklyFooter}>
          <Text style={styles.weeklyFooterText}>
            총 운동 {weeklyStats.workout_count}회 · {formatDuration(weeklyStats.total_duration_sec)}
          </Text>
        </View>
      </View>

      {hasApiKey && (
        <TouchableOpacity
          style={styles.tipCard}
          onPress={() => router.push('/(app)/ai/coach')}
          activeOpacity={0.8}
        >
          <View style={styles.tipHeader}>
            <Ionicons name="sparkles" size={16} color={colors.gold} />
            <Text style={styles.tipHeaderText}>AI 코치 오늘의 팁</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </View>
          {tipLoading ? (
            <ActivityIndicator color={colors.gold} size="small" style={styles.tipLoader} />
          ) : (
            <Text style={styles.tipText}>
              {dailyTip ?? '탭하면 AI 코치와 대화할 수 있어요'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 운동</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/history')}>
            <Text style={styles.sectionMore}>전체 보기</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : recentWorkouts.length === 0 ? (
          <EmptyState
            icon="barbell-outline"
            title="아직 기록이 없어요"
            description="첫 번째 운동을 기록해보세요!"
            actionLabel="운동 기록하기"
            onAction={() => router.push('/(app)/log')}
          />
        ) : (
          recentWorkouts.slice(0, 3).map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/log')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.text} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function WeeklyBubble({
  emoji,
  label,
  value,
  color,
}: {
  emoji: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.bubbleEmoji}>{emoji}</Text>
      <Text style={[styles.bubbleValue, { color }]}>{value}</Text>
      <Text style={styles.bubbleLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  subGreeting: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  profileBtn: { padding: 4 },
  weeklyCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  weeklyRow: { flexDirection: 'row', justifyContent: 'space-around' },
  bubble: { alignItems: 'center' },
  bubbleEmoji: { fontSize: 28, marginBottom: 6 },
  bubbleValue: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  bubbleLabel: { color: colors.textMuted, fontSize: 11 },
  weeklyFooter: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 10 },
  weeklyFooterText: { color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
  tipCard: {
    backgroundColor: '#1A1500',
    borderWidth: 1,
    borderColor: colors.gold + '40',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tipHeaderText: { flex: 1, color: colors.gold, fontSize: 12, fontWeight: '600' },
  tipLoader: { paddingVertical: 8 },
  tipText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  section: { paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  sectionMore: { color: colors.primary, fontSize: 13 },
  loader: { paddingVertical: 40 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
