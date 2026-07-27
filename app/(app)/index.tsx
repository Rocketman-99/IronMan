import { useEffect, useCallback } from 'react';
import { MarkdownText } from '../../src/components/common/MarkdownText';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors, sportColors } from '../../src/utils/theme';
import { t, sportLabels } from '../../src/i18n/ko';
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
    if (h < 12) return t.dashboard.greetingMorning;
    if (h < 18) return t.dashboard.greetingDay;
    return t.dashboard.greetingEvening;
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
          <Text style={styles.greeting}>{greeting}, {profile?.name ?? t.aiPrompt.fallbackName}님! 🔥</Text>
          <Text style={styles.subGreeting}>{t.dashboard.subGreeting}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {weeklyStats && (
        <View style={styles.weeklyCard}>
          <Text style={styles.sectionTitle}>{t.dashboard.weeklySummary}</Text>
          <View style={styles.weeklyGrid}>
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyValue}>{weeklyStats.workout_count}</Text>
              <Text style={styles.weeklyLabel}>{t.dashboard.workoutCount}</Text>
            </View>
            <View style={styles.weeklyDivider} />
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyValue}>{formatDuration(weeklyStats.total_duration_sec)}</Text>
              <Text style={styles.weeklyLabel}>{t.dashboard.totalTime}</Text>
            </View>
            <View style={styles.weeklyDivider} />
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyValue}>{formatDistanceKm(totalDistanceM)}</Text>
              <Text style={styles.weeklyLabel}>{t.dashboard.totalDistance}</Text>
            </View>
          </View>
        </View>
      )}

      {dailyTip ? (
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={16} color={colors.gold} />
            <Text style={styles.tipTitle}>{t.dashboard.dailyTipTitle}</Text>
          </View>
          <MarkdownText style={styles.tipText}>{dailyTip}</MarkdownText>
        </View>
      ) : !hasApiKey ? (
        <TouchableOpacity style={styles.setupCard} onPress={() => router.push('/settings')}>
          <Ionicons name="key-outline" size={20} color={colors.primary} />
          <Text style={styles.setupText}>{t.dashboard.setupApiKey}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/(app)/log')}>
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.logBtnText}>{t.dashboard.logWorkout}</Text>
      </TouchableOpacity>

      <View style={styles.aiRow}>
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/ai/coach')}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
          <Text style={styles.aiCardText}>{t.dashboard.aiCoach}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/ai/injury')}>
          <Ionicons name="medkit-outline" size={24} color={colors.warning} />
          <Text style={styles.aiCardText}>{t.dashboard.injuryRisk}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/ai/plan')}>
          <Ionicons name="calendar-outline" size={24} color={colors.success} />
          <Text style={styles.aiCardText}>{t.ai.planTitle}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/profile')}>
          <Ionicons name="person-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.aiCardText}>{t.profile.title}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t.dashboard.recentWorkouts}</Text>
      {recentWorkouts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t.dashboard.emptyWorkouts}</Text>
          <Text style={styles.emptySubText}>{t.dashboard.emptyWorkoutsHint}</Text>
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
