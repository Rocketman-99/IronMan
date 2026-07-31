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
    `INSERT INTO goals
       (sport_type, goal_type, title, target_value, unit, period, target_date, race_type, race_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    goal.sport_type,
    goal.goal_type,
    goal.title,
    goal.target_value,
    goal.unit,
    goal.period ?? null,
    goal.target_date ?? null,
    goal.race_type ?? null,
    goal.race_date ?? null,
    now
  );
  return result.lastInsertRowId;
}

export async function deleteGoal(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM goals WHERE id = ?', id);
}

/** 레이스 완주는 운동 기록으로 판정할 수 없어 사용자가 직접 표시한다. */
export async function completeGoal(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(
    'UPDATE goals SET is_completed = 1, completed_at = ? WHERE id = ?',
    getNowKST(),
    id
  );
}

/** 기간별 날짜 필터. `once` 는 기간 제한이 없어 전체를 누적한다. */
function dateFilter(period: Goal['period']): string {
  if (period === 'weekly') return `AND workout_date >= date('now', '-7 days', '+9 hours')`;
  if (period === 'monthly') return `AND workout_date >= date('now', 'start of month', '+9 hours')`;
  return '';
}

export async function syncGoalProgress(db: SQLiteDatabase): Promise<void> {
  const goals = await getAllGoals(db);
  const now = getNowKST();

  for (const goal of goals) {
    if (goal.is_completed) continue;
    // 레이스 목표는 운동 기록에서 진행률을 뽑을 수 없다 — 위 completeGoal 로 처리한다.
    if (goal.goal_type === 'race') continue;

    let current = 0;
    const filter = dateFilter(goal.period);

    if (goal.goal_type === 'distance' && goal.sport_type !== 'general') {
      const row = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(distance_m), 0) as total
         FROM workouts
         WHERE sport_type = ? ${filter}`,
        goal.sport_type
      );
      current = (row?.total ?? 0) / 1000; // m -> km
    } else if (goal.goal_type === 'frequency') {
      const sportFilter =
        goal.sport_type !== 'general' ? `AND sport_type = '${goal.sport_type}'` : '';

      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM workouts WHERE 1=1 ${sportFilter} ${filter}`
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
