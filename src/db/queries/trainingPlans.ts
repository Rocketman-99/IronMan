import { type SQLiteDatabase } from 'expo-sqlite';
import { type TrainingPlan } from '../../types';
import { getNowKST } from '../../utils/formatters';

/**
 * 생성한 훈련 계획 보관.
 *
 * 계획은 사용자가 직접 지울 때까지 남아야 한다. 예전에는 메모리에만 있어
 * 앱을 다시 켜거나 무선 업데이트가 적용되면 사라졌다.
 */

/** DB 에 저장된 계획 한 건. `plan` 은 JSON 을 풀어놓은 것이다. */
export interface StoredPlan {
  id: number;
  title: string;
  totalWeeks: number;
  plan: TrainingPlan;
  /** 'running,cycling' — 만들 때 고른 집중 종목 */
  focusSports: string | null;
  /** 생성 시점의 "고려한 정보". 나중에 왜 이런 계획이 나왔는지 되짚을 때 쓴다. */
  considered: { label: string; value: string }[] | null;
  createdAt: string;
}

interface PlanRow {
  id: number;
  title: string;
  total_weeks: number;
  plan_json: string;
  focus_sports: string | null;
  context_json: string | null;
  created_at: string;
}

/** JSON 이 깨져 있어도 목록 전체가 죽지 않도록 한 건씩 방어한다. */
function mapRow(row: PlanRow): StoredPlan | null {
  try {
    return {
      id: row.id,
      title: row.title,
      totalWeeks: row.total_weeks,
      plan: JSON.parse(row.plan_json) as TrainingPlan,
      focusSports: row.focus_sports,
      considered: row.context_json ? JSON.parse(row.context_json) : null,
      createdAt: row.created_at,
    };
  } catch {
    return null;
  }
}

export async function saveTrainingPlan(
  db: SQLiteDatabase,
  plan: TrainingPlan,
  opts?: { focusSports?: string; considered?: { label: string; value: string }[] }
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO training_plans
       (title, total_weeks, plan_json, focus_sports, context_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    plan.title,
    plan.totalWeeks,
    JSON.stringify(plan),
    opts?.focusSports ?? null,
    opts?.considered ? JSON.stringify(opts.considered) : null,
    getNowKST()
  );
  return result.lastInsertRowId;
}

/** 최신순. 화면에서 생성일과 함께 보여준다. */
export async function getTrainingPlans(db: SQLiteDatabase): Promise<StoredPlan[]> {
  const rows = await db.getAllAsync<PlanRow>(
    'SELECT * FROM training_plans ORDER BY created_at DESC, id DESC'
  );
  return rows.map(mapRow).filter((p): p is StoredPlan => p !== null);
}

export async function getTrainingPlanById(
  db: SQLiteDatabase,
  id: number
): Promise<StoredPlan | null> {
  const row = await db.getFirstAsync<PlanRow>(
    'SELECT * FROM training_plans WHERE id = ?',
    id
  );
  return row ? mapRow(row) : null;
}

export async function deleteTrainingPlan(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM training_plans WHERE id = ?', id);
}

export async function getTrainingPlanCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM training_plans'
  );
  return row?.count ?? 0;
}
