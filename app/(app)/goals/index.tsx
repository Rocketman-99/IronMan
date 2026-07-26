import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors, sportColors } from '../../../src/utils/theme';
import { useGoalsStore } from '../../../src/stores/goalsStore';
import { type Goal } from '../../../src/types';

function GoalCard({ goal, progress }: { goal: Goal; progress: number }) {
  const color = sportColors[goal.sport_type as keyof typeof sportColors] ?? colors.primary;
  const pct = Math.min(progress, 100);
  const done = goal.is_completed;
  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <View style={styles.cardTop}>
        <Text style={[styles.goalTitle, done && styles.goalTitleDone]}>{goal.title}</Text>
        {done && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
      </View>
      <Text style={styles.goalSub}>{goal.current_value.toFixed(1)} / {goal.target_value} {goal.unit}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: done ? colors.success : color }]} />
      </View>
      <Text style={styles.pctText}>{pct.toFixed(0)}%{goal.target_date ? ` · 목표일 ${goal.target_date}` : ''}</Text>
    </View>
  );
}

export default function Goals() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { goals, loadGoals, isLoading, progressPercent } = useGoalsStore();

  const load = useCallback(() => loadGoals(db), [db]);
  useEffect(() => { load(); }, []);

  const active = goals.filter(g => !g.is_completed);
  const done = goals.filter(g => g.is_completed);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>목표 관리</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/goals/new')} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...active, ...done]}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <GoalCard goal={item} progress={progressPercent(item)} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />}
        ListHeaderComponent={active.length === 0 && done.length === 0 ? null : (
          done.length > 0 ? <Text style={styles.sectionLabel}>진행 중 ({active.length})</Text> : null
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>설정된 목표가 없어요</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/goals/new')}>
              <Text style={styles.emptyBtnText}>+ 목표 추가</Text>
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
  sectionLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
  cardDone: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  goalTitle: { color: colors.text, fontWeight: '700', fontSize: 15, flex: 1 },
  goalTitleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  goalSub: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
  barBg: { height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 3 },
  pctText: { color: colors.textMuted, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginBottom: 16 },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
