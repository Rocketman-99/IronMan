import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import { WorkoutCard } from '../../../src/components/workout/WorkoutCard';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { colors, sportLabels } from '../../../src/utils/theme';
import { type SportType } from '../../../src/types';
import { getWorkoutsBySport, getRecentWorkouts } from '../../../src/db/queries/workouts';
import { type WorkoutWithDetails } from '../../../src/types';
import { useRouter } from 'expo-router';

type FilterType = 'all' | SportType;

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'running', label: sportLabels.running },
  { key: 'swimming', label: sportLabels.swimming },
  { key: 'cycling', label: sportLabels.cycling },
];

export default function HistoryScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [filter, setFilter] = useState<FilterType>('all');
  const [workouts, setWorkouts] = useState<WorkoutWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    setLoading(true);
    try {
      let data: WorkoutWithDetails[];
      if (filter === 'all') {
        data = await getRecentWorkouts(db, 100);
      } else {
        data = await getWorkoutsBySport(db, filter, 100);
      }
      setWorkouts(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>운동 기록</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : workouts.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="기록이 없어요"
          description="운동을 기록하면 여기에 표시됩니다"
          actionLabel="운동 기록하기"
          onAction={() => router.push('/(app)/log')}
        />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <WorkoutCard workout={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  filterBtnActive: { borderColor: colors.primary, backgroundColor: '#1A0808' },
  filterText: { color: colors.textSecondary, fontSize: 13 },
  filterTextActive: { color: colors.primaryLight, fontWeight: '600' },
  loader: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
});
