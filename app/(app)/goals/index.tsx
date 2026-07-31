import { useEffect, useCallback } from 'react';
import { t } from '../../../src/i18n/ko';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors, sportColors } from '../../../src/utils/theme';
import { useGoalsStore } from '../../../src/stores/goalsStore';
import { formatDday } from '../../../src/utils/races';
import { type Goal } from '../../../src/types';

function GoalCard({ goal, progress, onComplete }: {
  goal: Goal;
  progress: number;
  onComplete: (id: number) => void;
}) {
  const color = sportColors[goal.sport_type as keyof typeof sportColors] ?? colors.primary;
  const done = goal.is_completed === 1;
  const isRace = goal.goal_type === 'race';
  const dday = isRace ? formatDday(goal.race_date) : null;

  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <View style={styles.cardTop}>
        <Text style={[styles.goalTitle, done && styles.goalTitleDone]}>{goal.title}</Text>
        {done ? (
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.doneBadgeText}>{t.goals.completedBadge}</Text>
          </View>
        ) : dday ? (
          <Text style={styles.dday}>{dday}</Text>
        ) : null}
      </View>

      {isRace ? (
        <>
          <Text style={styles.goalSub}>
            {goal.race_type ? t.raceTypeDetail[goal.race_type] : ''}
            {goal.race_date ? ` · ${goal.race_date}` : ''}
          </Text>
          {/* 레이스 완주는 운동 기록으로 판정할 수 없어 사용자가 직접 표시한다. */}
          {!done && (
            <TouchableOpacity style={styles.completeBtn} onPress={() => onComplete(goal.id)}>
              <Text style={styles.completeBtnText}>{t.goals.markDone}</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <Text style={styles.goalSub}>
            {goal.current_value.toFixed(1)} / {goal.target_value} {goal.unit}
          </Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, {
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: done ? colors.success : color,
            }]} />
          </View>
          <Text style={styles.pctText}>
            {Math.min(progress, 100).toFixed(0)}%
            {goal.period ? ` · ${t.goalPeriod[goal.period]}` : ''}
            {goal.target_date ? ` · ${goal.target_date}` : ''}
          </Text>
        </>
      )}

      {done && goal.completed_at && (
        <Text style={styles.completedAt}>
          {t.goals.completedOn.replace('{date}', goal.completed_at.slice(0, 10))}
        </Text>
      )}
    </View>
  );
}

export default function Goals() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { goals, loadGoals, isLoading, progressPercent, markComplete } = useGoalsStore();

  const load = useCallback(() => loadGoals(db), [db]);
  useEffect(() => { load(); }, []);

  const active = goals.filter(g => !g.is_completed);
  const done = goals.filter(g => g.is_completed);

  async function handleComplete(id: number) {
    await markComplete(db, id);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.goals.title}</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/goals/new')} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...active, ...done]}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <GoalCard goal={item} progress={progressPercent(item)} onComplete={handleComplete} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t.goals.empty}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/goals/new')}>
              <Text style={styles.emptyBtnText}>{t.goals.add}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  addBtn: { padding: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
  cardDone: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  goalTitle: { color: colors.text, fontWeight: '700', fontSize: 15, flex: 1 },
  goalTitleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.success + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  doneBadgeText: { color: colors.success, fontSize: 11, fontWeight: '700' },
  dday: { color: colors.gold, fontSize: 13, fontWeight: '800' },
  goalSub: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
  barBg: { height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 3 },
  pctText: { color: colors.textMuted, fontSize: 11 },
  completeBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 4 },
  completeBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  completedAt: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginBottom: 16 },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
