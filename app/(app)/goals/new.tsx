import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { t } from '../../../src/i18n/ko';
import { GoalForm } from '../../../src/components/goals/GoalForm';
import { useGoalsStore } from '../../../src/stores/goalsStore';

export default function NewGoal() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { createGoal } = useGoalsStore();

  return (
    <GoalForm
      heading={t.goals.newTitle}
      onCancel={() => router.back()}
      onSubmit={async (goal) => {
        await createGoal(db, goal);
        router.back();
      }}
    />
  );
}
