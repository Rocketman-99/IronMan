/**
 * 마이그레이션이 기존 데이터를 지키는지 확인한다.
 *
 * 이미 앱을 쓰고 있는 기기에는 운동 기록과 목표가 쌓여 있다. 스키마를 바꾸면서
 * 그걸 날리면 되돌릴 방법이 없으므로, 구버전 스키마를 직접 만들어 놓고
 * 실제 SQL 엔진(node:sqlite) 위에서 마이그레이션을 돌려 검증한다.
 */
import { DatabaseSync } from 'node:sqlite';
import { migrateDbIfNeeded } from '../src/db';

/** expo-sqlite 의 SQLiteDatabase 중 마이그레이션이 실제로 쓰는 메서드만 흉내낸다. */
function adapter(db: DatabaseSync) {
  return {
    execAsync: async (sql: string) => {
      db.exec(sql);
    },
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

/** race_type / race_date 가 없던 시절의 스키마 + 사용자가 쌓아둔 데이터 */
function seedOldDatabase(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE user_profile (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, birth_date TEXT, gender TEXT,
      height_cm REAL, weight_kg REAL, fitness_level TEXT NOT NULL DEFAULT 'beginner',
      primary_goal TEXT, target_race_date TEXT, weekly_hours REAL DEFAULT 5,
      resting_hr INTEGER, max_hr INTEGER, onboarding_done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT, sport_type TEXT NOT NULL, goal_type TEXT NOT NULL,
      title TEXT NOT NULL, target_value REAL NOT NULL, current_value REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL, period TEXT, target_date TEXT,
      is_completed INTEGER NOT NULL DEFAULT 0, completed_at TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, sport_type TEXT NOT NULL, workout_date TEXT NOT NULL,
      duration_sec INTEGER NOT NULL, distance_m REAL NOT NULL, calories INTEGER, avg_hr INTEGER,
      max_hr INTEGER, feeling INTEGER, notes TEXT, temp_celsius REAL, humidity_pct INTEGER,
      ai_analysis TEXT, created_at TEXT NOT NULL
    );
    INSERT INTO user_profile (id, name, fitness_level, primary_goal, target_race_date, onboarding_done, created_at, updated_at)
      VALUES (1, '테스터', 'intermediate', 'olympic', '2026-09-01', 1, '2026-01-01', '2026-01-01');
    INSERT INTO goals (sport_type, goal_type, title, target_value, unit, period, created_at)
      VALUES ('running', 'distance', '주간 30km 러닝', 30, 'km', 'weekly', '2026-01-01');
    INSERT INTO workouts (sport_type, workout_date, duration_sec, distance_m, created_at)
      VALUES ('running', '2026-07-01', 1800, 5000, '2026-07-01');
  `);
  return db;
}

describe('migrateDbIfNeeded', () => {
  it('구버전 DB 에 레이스 컬럼을 추가한다', async () => {
    const db = seedOldDatabase();
    await migrateDbIfNeeded(adapter(db));

    const cols = db.prepare('PRAGMA table_info(goals);').all().map((c: any) => c.name);
    expect(cols).toContain('race_type');
    expect(cols).toContain('race_date');
  });

  it('프로필의 레이스 목표를 목표로 옮기고 목표일을 유지한다', async () => {
    const db = seedOldDatabase();
    await migrateDbIfNeeded(adapter(db));

    const race: any = db
      .prepare("SELECT * FROM goals WHERE goal_type = 'race';")
      .get();
    expect(race).toBeTruthy();
    expect(race.race_type).toBe('olympic');
    expect(race.race_date).toBe('2026-09-01');
  });

  it('기존 목표와 운동 기록을 건드리지 않는다', async () => {
    const db = seedOldDatabase();
    await migrateDbIfNeeded(adapter(db));

    const goal: any = db
      .prepare("SELECT * FROM goals WHERE goal_type = 'distance';")
      .get();
    expect(goal.title).toBe('주간 30km 러닝');
    expect(goal.target_value).toBe(30);

    const workouts: any[] = db.prepare('SELECT * FROM workouts;').all();
    expect(workouts).toHaveLength(1);
    expect(workouts[0].distance_m).toBe(5000);
  });

  it('두 번 돌려도 레이스 목표가 중복되지 않는다', async () => {
    const db = seedOldDatabase();
    await migrateDbIfNeeded(adapter(db));
    await migrateDbIfNeeded(adapter(db));

    const count: any = db
      .prepare("SELECT COUNT(*) as c FROM goals WHERE goal_type = 'race';")
      .get();
    expect(count.c).toBe(1);
  });

  it('레이스 목표가 없던 프로필은 목표를 만들지 않는다', async () => {
    const db = seedOldDatabase();
    db.exec('UPDATE user_profile SET primary_goal = NULL WHERE id = 1;');
    await migrateDbIfNeeded(adapter(db));

    const count: any = db
      .prepare("SELECT COUNT(*) as c FROM goals WHERE goal_type = 'race';")
      .get();
    expect(count.c).toBe(0);
  });

  it('새 설치(빈 DB)에서도 최신 버전까지 올라간다', async () => {
    const db = new DatabaseSync(':memory:');
    await migrateDbIfNeeded(adapter(db));

    const v: any = db.prepare('PRAGMA user_version;').get();
    expect(v.user_version).toBe(2);

    const goalCols = db.prepare('PRAGMA table_info(goals);').all().map((c: any) => c.name);
    expect(goalCols).toContain('race_type');
    const profileCols = db.prepare('PRAGMA table_info(user_profile);').all().map((c: any) => c.name);
    expect(profileCols).toContain('plan_focus_sports');
  });

  /* ── v2: 훈련 계획 집중 종목 ─────────────────────────── */

  it('v2 가 프로필에 집중 종목 컬럼을 추가한다', async () => {
    const db = seedOldDatabase();
    await migrateDbIfNeeded(adapter(db));

    const cols = db.prepare('PRAGMA table_info(user_profile);').all().map((c: any) => c.name);
    expect(cols).toContain('plan_focus_sports');

    // 기존 사용자는 값이 비어 있어야 한다 — 앱은 이때 3종 전부로 취급한다.
    const profile: any = db.prepare('SELECT * FROM user_profile WHERE id = 1;').get();
    expect(profile.plan_focus_sports).toBeNull();
  });

  it('v2 는 프로필의 기존 값을 건드리지 않는다', async () => {
    const db = seedOldDatabase();
    await migrateDbIfNeeded(adapter(db));

    const profile: any = db.prepare('SELECT * FROM user_profile WHERE id = 1;').get();
    expect(profile.name).toBe('테스터');
    expect(profile.fitness_level).toBe('intermediate');
    expect(profile.created_at).toBe('2026-01-01');
  });

  it('v1 만 적용된 DB 도 v2 까지 올라간다', async () => {
    // 지난 업데이트를 받아 v1 에 멈춰 있는 기기를 흉내낸다.
    const db = seedOldDatabase();
    db.exec('ALTER TABLE goals ADD COLUMN race_type TEXT;');
    db.exec('ALTER TABLE goals ADD COLUMN race_date TEXT;');
    db.exec('PRAGMA user_version = 1;');

    await migrateDbIfNeeded(adapter(db));

    const v: any = db.prepare('PRAGMA user_version;').get();
    expect(v.user_version).toBe(2);
    const cols = db.prepare('PRAGMA table_info(user_profile);').all().map((c: any) => c.name);
    expect(cols).toContain('plan_focus_sports');
    // v1 을 다시 돌리지 않았으므로 레이스 목표가 새로 생기면 안 된다.
    const count: any = db.prepare("SELECT COUNT(*) as c FROM goals WHERE goal_type = 'race';").get();
    expect(count.c).toBe(0);
  });

  it('두 번 돌려도 집중 종목 값이 유지된다', async () => {
    const db = seedOldDatabase();
    await migrateDbIfNeeded(adapter(db));
    db.exec("UPDATE user_profile SET plan_focus_sports = 'running' WHERE id = 1;");
    await migrateDbIfNeeded(adapter(db));

    const profile: any = db.prepare('SELECT * FROM user_profile WHERE id = 1;').get();
    expect(profile.plan_focus_sports).toBe('running');
  });
});
