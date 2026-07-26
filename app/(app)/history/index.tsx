import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors, sportColors, sportLabels } from '../../../src/utils/theme';
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import { WorkoutCard } from '../../../src/components/workout/WorkoutCard';
import { type WorkoutWithDetails } from '../../../src/types';

type SportFilter = 'all' | 'running' | 'swimming' | 'cycling';

export default function History() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { recentWorkouts, refreshAll, isLoading } = useWorkoutStore();
  const [filter, setFilter] = useState<SportFilter>('all');

  const load = useCallback(() => refreshAll(db), [db]);
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? recentWorkouts : recentWorkouts.filter(w => w.sport_type === filter);

  const filters: { value: SportFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'running', label: '러닝' },
    { value: 'swimming', label: '수영' },
    { value: 'cycling', label: '사이클' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>운동 기록</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/log')} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <WorkoutCard workout={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>운동 기록이 없어요</Text>
            <Text style={styles.emptySubText}>첫 번째 훈련을 기록해보세요!</Text>
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
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  emptySubText: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
});
