import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../../src/utils/theme';
import { t } from '../../../src/i18n/ko';
import { GoalForm } from '../../../src/components/goals/GoalForm';
import { useGoalsStore } from '../../../src/stores/goalsStore';
import { getGoalById } from '../../../src/db/queries/goals';
import { type Goal } from '../../../src/types';

export default function EditGoal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { updateGoal, deleteGoal } = useGoalsStore();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGoalById(db, Number(id)).then((g) => { setGoal(g); setLoading(false); });
  }, [id]);

  function handleDelete() {
    Alert.alert(t.goals.deleteTitle, t.goals.deleteConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          await deleteGoal(db, Number(id));
          router.back();
        },
      },
    ]);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!goal) {
    return <View style={styles.center}><Text style={styles.notFound}>{t.goals.notFound}</Text></View>;
  }

  return (
    <GoalForm
      heading={t.goals.editTitle}
      initial={goal}
      onCancel={() => router.back()}
      onDelete={handleDelete}
      onSubmit={async (next) => {
        await updateGoal(db, Number(id), next);
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  notFound: { color: colors.textSecondary, fontSize: 15 },
});
