import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGoalsStore } from '../../../src/stores/goalsStore';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { colors } from '../../../src/utils/theme';
import { type Goal } from '../../../src/types';

export default function GoalsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { goals, isLoading, loadGoals, syncProgress, deleteGoal, progressPercent } = useGoalsStore();

  useEffect(() => {
    (async () => { await syncProgress(db); await loadGoals(db); })();
  }, []);

  const active = goals.filter(g => !g.is_completed);
  const completed = goals.filter(g => g.is_completed);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>목표</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/goals/new')} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {active.length === 0 && completed.length === 0 ? (
            <EmptyState icon="flag-outline" title="목표가 없어요" description="첫 번째 훈련 목표를 설정해보세요" actionLabel="목표 추가하기" onAction={() => router.push('/(app)/goals/new')} />
          ) : (
            <>
              {active.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>진행 중</Text>
                  {active.map(g => <GoalCard key={g.id} goal={g} progress={progressPercent(g)} onDelete={() => handleDelete(g.id)} />)}
                </>
              )}
              {completed.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, styles.sectionCompleted]}>달성 완료 🎉</Text>
                  {completed.map(g => <GoalCard key={g.id} goal={g} progress={100} onDelete={() => handleDelete(g.id)} completed />)}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );

  async function handleDelete(id: number) {
    Alert.alert('목표 삭제', '이 목표를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await deleteGoal(db, id); await loadGoals(db); } },
    ]);
  }
}

function GoalCard({ goal, progress, onDelete, completed = false }: { goal: Goal; progress: number; onDelete: () => void; completed?: boolean; }) {
  const daysLeft = goal.target_date ? Math.max(0, Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const barColor = completed ? colors.success : progress >= 80 ? colors.success : progress >= 50 ? colors.warning : colors.primary;
  return (
    <View style={[styles.goalCard, completed && styles.goalCardCompleted]}>
      <View style={styles.goalTop}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <TouchableOpacity onPress={onDelete}><Ionicons name="close" size={16} color={colors.textMuted} /></TouchableOpacity>
      </View>
      <View style={styles.goalMeta}>
        <Text style={styles.goalProgress}>{goal.current_value.toFixed(1)} / {goal.target_value}{goal.unit}</Text>
        <Text style={[styles.goalPercent, { color: barColor }]}>{progress}%</Text>
      </View>
      <View style={styles.barBg}><View style={[styles.barFill, { width: `${Math.min(100, progress)}%`, backgroundColor: barColor }]} /></View>
      {daysLeft !== null && !completed && <Text style={styles.goalDue}>{daysLeft > 0 ? `D-${daysLeft}` : '기간 종료'}</Text>}
      {completed && <Text style={styles.completedBadge}>✅ 달성!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  addBtn: { backgroundColor: colors.primary, borderRadius: 20, padding: 6 },
  loader: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  sectionCompleted: { marginTop: 24 },
  goalCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10 },
  goalCardCompleted: { opacity: 0.7 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalTitle: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  goalProgress: { color: colors.textSecondary, fontSize: 13 },
  goalPercent: { fontSize: 13, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: colors.divider, borderRadius: 3, marginBottom: 8 },
  barFill: { height: 6, borderRadius: 3 },
  goalDue: { color: colors.textMuted, fontSize: 12 },
  completedBadge: { color: colors.success, fontSize: 12, fontWeight: '600' },
});
