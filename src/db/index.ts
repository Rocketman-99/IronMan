import { type SQLiteDatabase } from 'expo-sqlite';
import { ALL_TABLES } from './schema';

/**
 * 스키마 버전. 컬럼을 추가하거나 데이터를 옮길 때마다 하나 올리고
 * 아래 `MIGRATIONS` 에 그 단계를 추가한다.
 *
 * CREATE TABLE IF NOT EXISTS 만으로는 **이미 앱을 쓰고 있는 기기의 테이블에
 * 컬럼이 추가되지 않는다.** 그래서 PRAGMA user_version 으로 단계를 관리한다.
 */
const LATEST_VERSION = 1;

type Migration = (db: SQLiteDatabase) => Promise<void>;

/** 이미 있는 컬럼에 ALTER 를 걸면 에러가 나므로 먼저 확인한다. */
async function hasColumn(db: SQLiteDatabase, table: string, column: string): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
  return rows.some((r) => r.name === column);
}

const MIGRATIONS: Record<number, Migration> = {
  /**
   * v1 — 레이스 목표를 프로필에서 목표 테이블로 옮긴다.
   *
   * 이전에는 레이스 목표가 user_profile.primary_goal 에 하나만 저장됐다.
   * 이제 목표 탭에서 여러 개를 각자 다른 목표일로 관리하므로, 기존 값을
   * 목표 한 건으로 옮겨 사용자가 설정해둔 내용을 잃지 않게 한다.
   *
   * user_profile 의 옛 컬럼은 지우지 않는다 — SQLite 의 컬럼 삭제는 테이블
   * 재생성이라 데이터를 잃을 위험이 있고, 앱이 더는 읽지 않으므로 그대로 둬도 무해하다.
   */
  1: async (db) => {
    if (!(await hasColumn(db, 'goals', 'race_type'))) {
      await db.execAsync('ALTER TABLE goals ADD COLUMN race_type TEXT;');
    }
    if (!(await hasColumn(db, 'goals', 'race_date'))) {
      await db.execAsync('ALTER TABLE goals ADD COLUMN race_date TEXT;');
    }

    const profile = await db.getFirstAsync<{
      primary_goal: string | null;
      target_race_date: string | null;
    }>('SELECT primary_goal, target_race_date FROM user_profile WHERE id = 1;');

    if (!profile?.primary_goal) return;

    // 같은 레이스 목표가 이미 옮겨져 있으면 중복 생성하지 않는다.
    const existing = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM goals WHERE goal_type = 'race' AND race_type = ?;",
      profile.primary_goal
    );
    if ((existing?.count ?? 0) > 0) return;

    await db.runAsync(
      `INSERT INTO goals
         (sport_type, goal_type, title, target_value, unit, period, race_type, race_date, created_at)
       VALUES ('general', 'race', ?, 1, '회', 'once', ?, ?, ?)`,
      RACE_GOAL_TITLES[profile.primary_goal] ?? profile.primary_goal,
      profile.primary_goal,
      profile.target_race_date ?? null,
      new Date().toISOString()
    );
  },
};

/**
 * 마이그레이션에서만 쓰는 제목 표. 화면 문구(`src/i18n/ko.ts`)와 별도로 두는 이유는,
 * 마이그레이션이 만들어낸 목표 제목은 그 시점에 DB 에 박히는 값이라
 * 나중에 문구를 바꿔도 소급되지 않기 때문이다.
 */
const RACE_GOAL_TITLES: Record<string, string> = {
  sprint: '스프린트 트라이애슬론 완주',
  olympic: '올림픽 트라이애슬론 완주',
  half_ironman: '하프 아이언맨 완주',
  full_ironman: '풀 아이언맨 완주',
};

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  for (const sql of ALL_TABLES) {
    await db.execAsync(sql);
  }

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let version = row?.user_version ?? 0;

  while (version < LATEST_VERSION) {
    const next = version + 1;
    const migrate = MIGRATIONS[next];
    if (migrate) await migrate(db);
    // PRAGMA 는 바인딩 파라미터를 받지 않는다.
    await db.execAsync(`PRAGMA user_version = ${next};`);
    version = next;
  }
}
