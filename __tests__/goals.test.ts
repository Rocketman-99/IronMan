/**
 * 목표 수정·삭제와 훈련 계획 집중 종목 해석.
 *
 * 수정은 실제 SQL 로 확인한다 — 어떤 컬럼을 UPDATE 하고 어떤 걸 남겨두는지가
 * 핵심이라(진행률과 생성일이 날아가면 안 된다) 목으로는 의미가 없다.
 */
import { DatabaseSync } from 'node:sqlite';
import { migrateDbIfNeeded } from '../src/db';
import { createGoal, updateGoal, deleteGoal, getGoalById, getAllGoals } from '../src/db/queries/goals';
import { parseFocus, ALL_SPORTS } from '../src/services/ai/context';

function adapter(db: DatabaseSync) {
  return {
    execAsync: async (sql: string) => { db.exec(sql); },
    getAllAsync: async (sql: string, ...params: unknown[]) =>
      db.prepare(sql).all(...(params as never[])),
    getFirstAsync: async (sql: string, ...params: unknown[]) =>
      db.prepare(sql).get(...(params as never[])) ?? null,
    runAsync: async (sql: string, ...params: unknown[]) => {
      const r = db.prepare(sql).run(...(params as never[]));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
  } as never;
}

async function freshDb() {
  const raw = new DatabaseSync(':memory:');
  const db = adapter(raw);
  await migrateDbIfNeeded(db);
  return { raw, db };
}

describe('목표 수정·삭제', () => {
  it('내용을 고쳐도 진행률과 생성일은 그대로 둔다', async () => {
    const { raw, db } = await freshDb();
    const id = await createGoal(db, {
      sport_type: 'running', goal_type: 'distance',
      title: '주간 30km', target_value: 30, unit: 'km', period: 'weekly',
    });
    // 운동을 기록해 진행률이 쌓인 상태를 만든다.
    raw.exec(`UPDATE goals SET current_value = 12.5 WHERE id = ${id};`);
    const before: any = raw.prepare('SELECT created_at FROM goals WHERE id = ?;').get(id);

    await updateGoal(db, id, {
      sport_type: 'cycling', goal_type: 'distance',
      title: '주간 100km 사이클', target_value: 100, unit: 'km', period: 'monthly',
    });

    const after = await getGoalById(db, id);
    expect(after?.title).toBe('주간 100km 사이클');
    expect(after?.sport_type).toBe('cycling');
    expect(after?.target_value).toBe(100);
    expect(after?.period).toBe('monthly');
    // 목표치를 바꿨다고 지금까지 달린 거리가 사라지면 안 된다.
    expect(after?.current_value).toBe(12.5);
    expect(after?.created_at).toBe(before.created_at);
  });

  it('레이스 목표의 종류와 날짜를 바꿀 수 있다', async () => {
    const { db } = await freshDb();
    const id = await createGoal(db, {
      sport_type: 'general', goal_type: 'race', title: '올림픽 완주',
      target_value: 1, unit: '회', period: 'once',
      race_type: 'olympic', race_date: '2026-09-01',
    });

    await updateGoal(db, id, {
      sport_type: 'general', goal_type: 'race', title: '풀 마라톤 완주',
      target_value: 1, unit: '회', period: 'once',
      race_type: 'full_marathon', race_date: '2027-03-15',
    });

    const after = await getGoalById(db, id);
    expect(after?.race_type).toBe('full_marathon');
    expect(after?.race_date).toBe('2027-03-15');
  });

  it('일반 목표로 바꾸면 레이스 필드가 비워진다', async () => {
    const { db } = await freshDb();
    const id = await createGoal(db, {
      sport_type: 'general', goal_type: 'race', title: '올림픽 완주',
      target_value: 1, unit: '회', period: 'once',
      race_type: 'olympic', race_date: '2026-09-01',
    });

    await updateGoal(db, id, {
      sport_type: 'running', goal_type: 'distance',
      title: '주간 30km', target_value: 30, unit: 'km', period: 'weekly',
    });

    const after = await getGoalById(db, id);
    // 남아 있으면 목록이 이걸 레이스로 오해해 D-day 를 띄운다.
    expect(after?.race_type).toBeNull();
    expect(after?.race_date).toBeNull();
  });

  it('달성한 목표도 지울 수 있다', async () => {
    const { raw, db } = await freshDb();
    const id = await createGoal(db, {
      sport_type: 'running', goal_type: 'distance',
      title: '완료된 목표', target_value: 10, unit: 'km', period: 'weekly',
    });
    raw.exec(`UPDATE goals SET is_completed = 1 WHERE id = ${id};`);

    await deleteGoal(db, id);

    expect(await getGoalById(db, id)).toBeNull();
    expect(await getAllGoals(db)).toHaveLength(0);
  });

  it('없는 목표를 읽으면 null 이다', async () => {
    const { db } = await freshDb();
    expect(await getGoalById(db, 999)).toBeNull();
  });
});

describe('parseFocus', () => {
  it('저장된 문자열을 종목 배열로 읽는다', () => {
    expect(parseFocus('running,cycling')).toEqual(['running', 'cycling']);
  });

  it('공백이 섞여도 읽는다', () => {
    expect(parseFocus('running, swimming')).toEqual(['running', 'swimming']);
  });

  it('비어 있으면 3종 전부로 본다', () => {
    // 기존 사용자는 이 값이 NULL 이라 지금까지와 같게 동작해야 한다.
    expect(parseFocus(null)).toEqual(ALL_SPORTS);
    expect(parseFocus('')).toEqual(ALL_SPORTS);
    expect(parseFocus(undefined)).toEqual(ALL_SPORTS);
  });

  it('알 수 없는 값은 버리고, 전부 이상하면 3종 전부로 본다', () => {
    expect(parseFocus('running,yoga')).toEqual(['running']);
    expect(parseFocus('yoga,climbing')).toEqual(ALL_SPORTS);
  });
});
