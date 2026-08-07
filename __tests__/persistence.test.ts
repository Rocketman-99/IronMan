/**
 * AI 결과가 기기에 남는지, 운동 목록에 상한이 없는지.
 *
 * 이번 신고("계획이 사라진다")의 원인은 계획이 메모리에만 있었던 것이고,
 * 같이 확인한 두 번째 문제는 목록 조회의 기본 상한 20 이었다. 둘 다 실제 SQL
 * 위에서 잡는다 — 목으로는 저장 여부도, 쿼리 횟수도 확인할 수 없다.
 */
import { DatabaseSync } from 'node:sqlite';
import { migrateDbIfNeeded } from '../src/db';
import { saveWorkout, getRecentWorkouts, getWorkoutById, getWorkoutCount } from '../src/db/queries/workouts';
import {
  saveTrainingPlan,
  getTrainingPlans,
  deleteTrainingPlan,
  getTrainingPlanCount,
} from '../src/db/queries/trainingPlans';
import {
  SETTING_KEYS,
  getJsonSetting,
  setJsonSetting,
  saveConversation,
  replaceConversation,
  getLatestConversation,
  deleteConversations,
} from '../src/db/queries/ai-logs';
import { type TrainingPlan } from '../src/types';

/** 실행된 SELECT 문을 세어 N+1 재발을 잡는다. */
function adapter(raw: DatabaseSync, counter?: { selects: number }) {
  return {
    execAsync: async (sql: string) => { raw.exec(sql); },
    getAllAsync: async (sql: string, ...p: unknown[]) => {
      if (counter && /^\s*SELECT/i.test(sql)) counter.selects++;
      return raw.prepare(sql).all(...(p as never[]));
    },
    getFirstAsync: async (sql: string, ...p: unknown[]) => {
      if (counter && /^\s*SELECT/i.test(sql)) counter.selects++;
      return raw.prepare(sql).get(...(p as never[])) ?? null;
    },
    runAsync: async (sql: string, ...p: unknown[]) => {
      const r = raw.prepare(sql).run(...(p as never[]));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
  } as never;
}

async function freshDb(counter?: { selects: number }) {
  const raw = new DatabaseSync(':memory:');
  const db = adapter(raw, counter);
  await migrateDbIfNeeded(db);
  return { raw, db };
}

const PLAN: TrainingPlan = {
  title: '4주 러닝 집중',
  totalWeeks: 4,
  weeks: [
    { weekNumber: 1, focus: '기초', sessions: [{ day: '월요일', sport: 'running', type: 'easy', duration: '30분', description: '가볍게' }] },
    { weekNumber: 2, focus: '증량', sessions: [{ day: '수요일', sport: 'running', type: 'tempo', duration: '40분', description: '템포' }] },
  ],
};

describe('훈련 계획 보관', () => {
  it('저장한 계획을 그대로 다시 읽는다', async () => {
    const { db } = await freshDb();
    await saveTrainingPlan(db, PLAN, { focusSports: 'running', considered: [{ label: '운동 기록', value: '12건' }] });

    const [stored] = await getTrainingPlans(db);
    expect(stored.plan.title).toBe('4주 러닝 집중');
    // 주차와 세션이 JSON 왕복에서 뭉개지면 안 된다.
    expect(stored.plan.weeks).toHaveLength(2);
    expect(stored.plan.weeks[1].sessions[0].description).toBe('템포');
    expect(stored.focusSports).toBe('running');
    expect(stored.considered).toEqual([{ label: '운동 기록', value: '12건' }]);
    expect(stored.createdAt).toBeTruthy();
  });

  it('여러 개가 쌓이고 최신이 위로 온다', async () => {
    const { raw, db } = await freshDb();
    await saveTrainingPlan(db, { ...PLAN, title: '오래된 계획' });
    await saveTrainingPlan(db, { ...PLAN, title: '새 계획' });
    // 같은 초에 저장되면 created_at 이 같으므로 id 로도 갈라야 한다.
    raw.exec("UPDATE training_plans SET created_at = '2026-01-01T00:00:00+09:00' WHERE title = '오래된 계획';");

    const plans = await getTrainingPlans(db);
    expect(plans.map((p) => p.plan.title)).toEqual(['새 계획', '오래된 계획']);
    expect(await getTrainingPlanCount(db)).toBe(2);
  });

  it('하나를 지워도 나머지는 남는다', async () => {
    const { db } = await freshDb();
    await saveTrainingPlan(db, { ...PLAN, title: 'A' });
    const keepId = await saveTrainingPlan(db, { ...PLAN, title: 'B' });
    const plans = await getTrainingPlans(db);

    await deleteTrainingPlan(db, plans.find((p) => p.plan.title === 'A')!.id);

    const left = await getTrainingPlans(db);
    expect(left).toHaveLength(1);
    expect(left[0].id).toBe(keepId);
  });

  it('JSON 이 깨진 계획은 건너뛰고 나머지를 보여준다', async () => {
    const { raw, db } = await freshDb();
    await saveTrainingPlan(db, PLAN);
    raw.exec(`INSERT INTO training_plans (title, total_weeks, plan_json, created_at)
              VALUES ('깨진 계획', 4, '{not json', '2026-01-01T00:00:00+09:00');`);

    // 한 건이 깨졌다고 목록 전체가 죽으면 안 된다.
    const plans = await getTrainingPlans(db);
    expect(plans).toHaveLength(1);
    expect(plans[0].plan.title).toBe('4주 러닝 집중');
  });
});

describe('app_settings 왕복', () => {
  it('오늘의 팁을 날짜와 함께 남긴다', async () => {
    const { db } = await freshDb();
    await setJsonSetting(db, SETTING_KEYS.dailyTip, { tip: '회복에 신경 쓰세요', date: '2026-08-07' });

    const saved = await getJsonSetting<{ tip: string; date: string }>(db, SETTING_KEYS.dailyTip);
    // 날짜가 남아야 재시작 후에도 "하루 한 번"이 지켜진다.
    expect(saved).toEqual({ tip: '회복에 신경 쓰세요', date: '2026-08-07' });
  });

  it('AI 사용량이 이어진다', async () => {
    const { db } = await freshDb();
    await setJsonSetting(db, SETTING_KEYS.aiUsage, { date: '2026-08-07', points: 6 });
    expect(await getJsonSetting<{ points: number }>(db, SETTING_KEYS.aiUsage)).toEqual({
      date: '2026-08-07',
      points: 6,
    });
  });

  it('값을 덮어쓴다', async () => {
    const { db } = await freshDb();
    await setJsonSetting(db, SETTING_KEYS.aiUsage, { date: '2026-08-07', points: 1 });
    await setJsonSetting(db, SETTING_KEYS.aiUsage, { date: '2026-08-07', points: 4 });
    expect(await getJsonSetting<{ points: number }>(db, SETTING_KEYS.aiUsage)).toEqual({
      date: '2026-08-07',
      points: 4,
    });
  });

  it('깨진 값은 없는 것으로 친다', async () => {
    const { raw, db } = await freshDb();
    raw.exec("INSERT INTO app_settings (key, value) VALUES ('daily_tip', '{broken');");
    expect(await getJsonSetting(db, SETTING_KEYS.dailyTip)).toBeNull();
  });

  it('없는 키는 null', async () => {
    const { db } = await freshDb();
    expect(await getJsonSetting(db, SETTING_KEYS.injuryAssessment)).toBeNull();
  });
});

describe('코치 대화 보관', () => {
  it('마지막 대화를 이어서 보여준다', async () => {
    const { db } = await freshDb();
    await saveConversation(db, 'coaching', [{ role: 'user', content: '안녕' }]);
    await saveConversation(db, 'coaching', [
      { role: 'user', content: '안녕' },
      { role: 'assistant', content: '반갑습니다' },
    ]);

    const messages = await getLatestConversation(db, 'coaching');
    expect(messages).toHaveLength(2);
    expect(messages[1].content).toBe('반갑습니다');
  });

  it('지우면 남지 않는다', async () => {
    const { db } = await freshDb();
    await saveConversation(db, 'coaching', [{ role: 'user', content: '안녕' }]);
    await deleteConversations(db, 'coaching');
    expect(await getLatestConversation(db, 'coaching')).toEqual([]);
  });

  it('대화가 없으면 빈 배열', async () => {
    const { db } = await freshDb();
    expect(await getLatestConversation(db, 'coaching')).toEqual([]);
  });

  it('턴이 쌓여도 한 행만 남는다', async () => {
    const { raw, db } = await freshDb();
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];

    // 10턴을 주고받는다. 매 턴 대화 전체를 저장한다.
    for (let i = 0; i < 10; i++) {
      messages.push({ role: 'user', content: `질문 ${i}` });
      messages.push({ role: 'assistant', content: `답변 ${i}` });
      await replaceConversation(db, 'coaching', messages);
    }

    // 예전에는 매 턴 INSERT 라 10행이 쌓였다 — 메시지 110개 분량.
    const rows: any[] = raw.prepare("SELECT * FROM ai_conversations WHERE conv_type = 'coaching';").all();
    expect(rows).toHaveLength(1);

    const latest = await getLatestConversation(db, 'coaching');
    expect(latest).toHaveLength(20);
    expect(latest[19].content).toBe('답변 9');
  });

  it('다른 종류의 대화는 건드리지 않는다', async () => {
    const { raw, db } = await freshDb();
    await saveConversation(db, 'analysis', [{ role: 'user', content: '운동 분석' }]);
    await replaceConversation(db, 'coaching', [{ role: 'user', content: '안녕' }]);
    await replaceConversation(db, 'coaching', [{ role: 'user', content: '안녕 다시' }]);

    const analysis: any[] = raw.prepare("SELECT * FROM ai_conversations WHERE conv_type = 'analysis';").all();
    expect(analysis).toHaveLength(1);
    const coaching: any[] = raw.prepare("SELECT * FROM ai_conversations WHERE conv_type = 'coaching';").all();
    expect(coaching).toHaveLength(1);
  });

  it('갱신 도중에도 대화가 비는 순간이 없다', async () => {
    const { raw, db } = await freshDb();
    await replaceConversation(db, 'coaching', [{ role: 'user', content: '처음' }]);

    // 새 행을 넣기 전에 지우면 그 사이에 앱이 죽었을 때 대화가 사라진다.
    // 항상 최소 한 행이 있어야 한다.
    const before: any = raw.prepare("SELECT COUNT(*) as c FROM ai_conversations WHERE conv_type = 'coaching';").get();
    expect(before.c).toBe(1);

    await replaceConversation(db, 'coaching', [{ role: 'user', content: '다음' }]);
    const after: any = raw.prepare("SELECT COUNT(*) as c FROM ai_conversations WHERE conv_type = 'coaching';").get();
    expect(after.c).toBe(1);
    expect((await getLatestConversation(db, 'coaching'))[0].content).toBe('다음');
  });
});

describe('운동 목록 상한', () => {
  async function seed(db: never, count: number) {
    for (let i = 0; i < count; i++) {
      await saveWorkout(db, {
        sport_type: 'running',
        workout_date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
        duration_sec: 1800,
        distance_m: 5000,
        running: { avg_pace_sec_km: 360 },
      });
    }
  }

  it('300건을 넣어도 전부 돌아온다', async () => {
    const { db } = await freshDb();
    await seed(db, 300);
    // 예전에는 기본 상한 20 이 걸려 21번째부터 화면에서 사라졌다.
    expect(await getRecentWorkouts(db)).toHaveLength(300);
    expect(await getWorkoutCount(db)).toBe(300);
  });

  it('limit 을 주면 그만큼만 (AI 컨텍스트용)', async () => {
    const { db } = await freshDb();
    await seed(db, 50);
    expect(await getRecentWorkouts(db, 7)).toHaveLength(7);
  });

  it('건수가 늘어도 조회는 한 번이다', async () => {
    const counter = { selects: 0 };
    const { db } = await freshDb(counter);
    await seed(db, 40);

    counter.selects = 0;
    await getRecentWorkouts(db);
    // 예전에는 운동 1건마다 상세를 따로 읽어 41번 돌았다(N+1).
    expect(counter.selects).toBe(1);
  });
});

describe('상세 조인 매퍼', () => {
  it('종목별 상세가 제자리에 붙는다', async () => {
    const { db } = await freshDb();
    await saveWorkout(db, {
      sport_type: 'running', workout_date: '2026-01-03', duration_sec: 1800, distance_m: 5000,
      running: { avg_pace_sec_km: 360, cadence_spm: 180, elevation_gain_m: 12, surface: 'trail' },
    });
    await saveWorkout(db, {
      sport_type: 'swimming', workout_date: '2026-01-02', duration_sec: 2400, distance_m: 1000,
      swimming: { pool_length_m: 50, total_laps: 20, stroke_type: 'butterfly' },
    });
    await saveWorkout(db, {
      sport_type: 'cycling', workout_date: '2026-01-01', duration_sec: 3600, distance_m: 30000,
      cycling: { avg_speed_kmh: 30, avg_power_w: 200, elevation_gain_m: 450, bike_type: 'tt' },
    });

    const [run, swim, bike] = await getRecentWorkouts(db);

    expect(run.running?.surface).toBe('trail');
    expect(run.swimming).toBeUndefined();
    expect(run.cycling).toBeUndefined();
    // running_details 와 cycling_details 양쪽에 elevation_gain_m 가 있다.
    // 별칭 없이 조인하면 러닝 기록에 사이클 고도(450)가 들어온다.
    expect(run.running?.elevation_gain_m).toBe(12);

    expect(swim.swimming?.stroke_type).toBe('butterfly');
    expect(swim.swimming?.pool_length_m).toBe(50);
    expect(swim.running).toBeUndefined();

    expect(bike.cycling?.bike_type).toBe('tt');
    expect(bike.cycling?.elevation_gain_m).toBe(450);
    expect(bike.running).toBeUndefined();
  });

  it('workouts.id 가 상세 테이블의 id 로 덮이지 않는다', async () => {
    const { db } = await freshDb();
    // 러닝을 두 건 넣으면 두 번째의 workouts.id 와 running_details.id 가 같아
    // 덮어쓰기가 일어나도 눈에 안 띈다. 수영을 하나 끼워 어긋나게 만든다.
    await saveWorkout(db, { sport_type: 'swimming', workout_date: '2026-01-01', duration_sec: 60, distance_m: 100, swimming: { total_laps: 4 } });
    const runId = await saveWorkout(db, {
      sport_type: 'running', workout_date: '2026-01-02', duration_sec: 1800, distance_m: 5000,
      running: { avg_pace_sec_km: 360 },
    });

    const [run] = await getRecentWorkouts(db);
    expect(run.id).toBe(runId);
    expect(run.running?.workout_id).toBe(runId);

    const byId = await getWorkoutById(db, runId);
    expect(byId?.id).toBe(runId);
    expect(byId?.running?.avg_pace_sec_km).toBe(360);
  });

  it('상세가 없는 운동도 읽힌다', async () => {
    const { db } = await freshDb();
    await saveWorkout(db, { sport_type: 'running', workout_date: '2026-01-01', duration_sec: 600, distance_m: 2000 });
    const [w] = await getRecentWorkouts(db);
    expect(w.running).toBeUndefined();
    expect(w.distance_m).toBe(2000);
  });
});
