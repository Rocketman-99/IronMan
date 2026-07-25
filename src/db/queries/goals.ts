import { type SQLiteDatabase } from 'expo-sqlite';
import { type Goal, type NewGoal } from '../../types';
import { getNowKST } from '../../utils/formatters';

export async function getAllGoals(db: SQLiteDatabase): Promise<Goal[]> {
  return db.getAllAsync<Goal>(
    'SELECT * FROM goals ORDER BY is_completed ASC, created_at DESC'
  );
}

export async function createGoal(db: SQLiteDatabase, goal: NewGoal): Promise<number> {
  const now = getNowKST();
  const result = await db.runAsync(
    `INSERT INTO goals (sport_type, goal_type, title, target_value, unit, period, target_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    goal.sport_type,
    goal.goal_type,
    goal.title,
    goal.target_value,
    goal.unit,
    goal.period ?? null,
    goal.target_date ?? null,
    now
  );
  return result.lastInsertRowId;
}

export async function deleteGoal(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM goals WHERE id = ?', id);
}

export async function syncGoalProgress(db: SQLiteDatabase): Promise<void> {
  const goals = await getAllGoals(db);
  const now = getNowKST();

  for (const goal of goals) {
    if (goal.is_completed) continue;

    let current = 0;

    if (goal.goal_type === 'distance' && goal.sport_type !== 'general') {
      const dateFilter =
        goal.period === 'weekly'
          ? `AND workout_date >= date('now', '-7 days', '+9 hours')`
          : goal.period === 'monthly'
          ? `AND workout_date >= date('now', 'start of month', '+9 hours')`
          : '';

      const row = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(distance_m), 0) as total
         FROM workouts
         WHERE sport_type = ? ${dateFilter}`,
        goal.sport_type
      );
      current = (row?.total ?? 0) / 1000;
    } else if (goal.goal_type === 'frequency') {
      const dateFilter =
        goal.period === 'weekly'
          ? `AND workout_date >= date('now', '-7 days', '+9 hours')`
          : goal.period === 'monthly'
          ? `AND workout_date >= date('now', 'start of month', '+9 hours')`
          : '';

      const sportFilter =
        goal.sport_type !== 'general' ? `AND sport_type = '${goal.sport_type}'` : '';

      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM workouts WHERE 1=1 ${sportFilter} ${dateFilter}`
      );
      current = row?.count ?? 0;
    }

    const completed = current >= goal.target_value ? 1 : 0;
    await db.runAsync(
      `UPDATE goals SET current_value = ?, is_completed = ?, completed_at = ?
       WHERE id = ?`,
      current,
      completed,
      completed ? now : null,
      goal.id
    );
  }
}
