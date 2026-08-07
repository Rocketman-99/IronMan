import { type SQLiteDatabase } from 'expo-sqlite';
import {
  type Workout,
  type WorkoutWithDetails,
  type WorkoutDraft,
  type WeeklyStats,
} from '../../types';
import { getNowKST, getWeekStartKST } from '../../utils/formatters';

/**
 * 운동 조회는 상세까지 한 번의 쿼리로 읽는다.
 *
 * 예전에는 목록을 읽은 뒤 운동 1건마다 종목별 상세를 따로 조회했다(N+1). 그래서
 * 기본 상한이 20건으로 묶여 있었고, 21번째부터는 DB 에 있는데도 화면에 나오지
 * 않았다. LEFT JOIN 으로 접어 왕복을 1회로 고정했으므로 상한이 필요 없다.
 *
 * `w.*` 를 쓰지 않고 컬럼을 하나씩 적는 이유: running_details 와 cycling_details
 * 양쪽에 `elevation_gain_m` 가 있고 세 상세 테이블 모두 `id` 를 가진다. 별칭 없이
 * 조인하면 SQLite 가 같은 이름을 마지막 값으로 덮어써, 러닝 기록에 사이클 고도가
 * 들어가는 식으로 조용히 오염된다.
 */
const WORKOUT_COLUMNS = `
  w.id, w.sport_type, w.workout_date, w.duration_sec, w.distance_m, w.calories,
  w.avg_hr, w.max_hr, w.feeling, w.notes, w.temp_celsius, w.humidity_pct,
  w.ai_analysis, w.created_at,
  r.id AS r_id, r.avg_pace_sec_km AS r_avg_pace_sec_km,
  r.best_pace_sec_km AS r_best_pace_sec_km, r.cadence_spm AS r_cadence_spm,
  r.elevation_gain_m AS r_elevation_gain_m, r.surface AS r_surface,
  s.id AS s_id, s.pool_length_m AS s_pool_length_m, s.total_laps AS s_total_laps,
  s.avg_pace_sec_100m AS s_avg_pace_sec_100m, s.stroke_type AS s_stroke_type,
  s.stroke_rate AS s_stroke_rate, s.swolf AS s_swolf,
  c.id AS c_id, c.avg_speed_kmh AS c_avg_speed_kmh, c.max_speed_kmh AS c_max_speed_kmh,
  c.avg_power_w AS c_avg_power_w, c.max_power_w AS c_max_power_w,
  c.avg_cadence_rpm AS c_avg_cadence_rpm, c.elevation_gain_m AS c_elevation_gain_m,
  c.bike_type AS c_bike_type
`;

const WORKOUT_JOINS = `
  FROM workouts w
  LEFT JOIN running_details  r ON r.workout_id = w.id
  LEFT JOIN swimming_details s ON s.workout_id = w.id
  LEFT JOIN cycling_details  c ON c.workout_id = w.id
`;

/** 조인 결과의 평탄한 행 하나를 WorkoutWithDetails 로 되돌린다. */
function mapRow(row: Record<string, unknown>): WorkoutWithDetails {
  const workout = {
    id: row.id, sport_type: row.sport_type, workout_date: row.workout_date,
    duration_sec: row.duration_sec, distance_m: row.distance_m, calories: row.calories,
    avg_hr: row.avg_hr, max_hr: row.max_hr, feeling: row.feeling, notes: row.notes,
    temp_celsius: row.temp_celsius, humidity_pct: row.humidity_pct,
    ai_analysis: row.ai_analysis, created_at: row.created_at,
  } as Workout;

  const result: WorkoutWithDetails = { ...workout };

  // 상세 행이 없으면 조인이 NULL 을 채우므로 id 로 존재 여부를 가른다.
  // 종목으로도 거를 수 있지만, 종목이 바뀐 과거 데이터가 있어도 안전하도록 id 를 본다.
  if (row.r_id != null) {
    result.running = {
      id: row.r_id as number, workout_id: workout.id,
      avg_pace_sec_km: row.r_avg_pace_sec_km as number | null,
      best_pace_sec_km: row.r_best_pace_sec_km as number | null,
      cadence_spm: row.r_cadence_spm as number | null,
      elevation_gain_m: row.r_elevation_gain_m as number | null,
      surface: row.r_surface as string | null,
    };
  }
  if (row.s_id != null) {
    result.swimming = {
      id: row.s_id as number, workout_id: workout.id,
      pool_length_m: row.s_pool_length_m as number,
      total_laps: row.s_total_laps as number | null,
      avg_pace_sec_100m: row.s_avg_pace_sec_100m as number | null,
      stroke_type: row.s_stroke_type as string | null,
      stroke_rate: row.s_stroke_rate as number | null,
      swolf: row.s_swolf as number | null,
    };
  }
  if (row.c_id != null) {
    result.cycling = {
      id: row.c_id as number, workout_id: workout.id,
      avg_speed_kmh: row.c_avg_speed_kmh as number | null,
      max_speed_kmh: row.c_max_speed_kmh as number | null,
      avg_power_w: row.c_avg_power_w as number | null,
      max_power_w: row.c_max_power_w as number | null,
      avg_cadence_rpm: row.c_avg_cadence_rpm as number | null,
      elevation_gain_m: row.c_elevation_gain_m as number | null,
      bike_type: row.c_bike_type as string | null,
    };
  }
  return result;
}
export async function saveWorkout(
  db: SQLiteDatabase,
  draft: WorkoutDraft
): Promise<number> {
  const now = getNowKST();
  const result = await db.runAsync(
    `INSERT INTO workouts
     (sport_type, workout_date, duration_sec, distance_m, calories, avg_hr, max_hr,
      feeling, notes, temp_celsius, humidity_pct, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    draft.sport_type,
    draft.workout_date,
    draft.duration_sec,
    draft.distance_m,
    draft.calories ?? null,
    draft.avg_hr ?? null,
    draft.max_hr ?? null,
    draft.feeling ?? null,
    draft.notes ?? null,
    draft.temp_celsius ?? null,
    draft.humidity_pct ?? null,
    now
  );

  const workoutId = result.lastInsertRowId;

  if (draft.sport_type === 'running' && draft.running) {
    const r = draft.running;
    await db.runAsync(
      `INSERT INTO running_details
       (workout_id, avg_pace_sec_km, best_pace_sec_km, cadence_spm, elevation_gain_m, surface)
       VALUES (?, ?, ?, ?, ?, ?)`,
      workoutId,
      r.avg_pace_sec_km ?? null,
      r.best_pace_sec_km ?? null,
      r.cadence_spm ?? null,
      r.elevation_gain_m ?? null,
      r.surface ?? null
    );
  } else if (draft.sport_type === 'swimming' && draft.swimming) {
    const s = draft.swimming;
    await db.runAsync(
      `INSERT INTO swimming_details
       (workout_id, pool_length_m, total_laps, avg_pace_sec_100m, stroke_type, stroke_rate, swolf)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      workoutId,
      s.pool_length_m ?? 25,
      s.total_laps ?? null,
      s.avg_pace_sec_100m ?? null,
      s.stroke_type ?? null,
      s.stroke_rate ?? null,
      s.swolf ?? null
    );
  } else if (draft.sport_type === 'cycling' && draft.cycling) {
    const c = draft.cycling;
    await db.runAsync(
      `INSERT INTO cycling_details
       (workout_id, avg_speed_kmh, max_speed_kmh, avg_power_w, max_power_w, avg_cadence_rpm, elevation_gain_m, bike_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      workoutId,
      c.avg_speed_kmh ?? null,
      c.max_speed_kmh ?? null,
      c.avg_power_w ?? null,
      c.max_power_w ?? null,
      c.avg_cadence_rpm ?? null,
      c.elevation_gain_m ?? null,
      c.bike_type ?? null
    );
  }

  return workoutId;
}

export async function getWorkoutById(
  db: SQLiteDatabase,
  id: number
): Promise<WorkoutWithDetails | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT ${WORKOUT_COLUMNS} ${WORKOUT_JOINS} WHERE w.id = ?`,
    id
  );
  return row ? mapRow(row) : null;
}

/**
 * 최신순 운동 목록.
 *
 * `limit` 을 넘기지 않으면 **전부** 읽는다. 화면 목록은 상한 없이 부르고
 * (FlatList 가 가상화하므로 건수가 늘어도 렌더는 문제없다), AI 컨텍스트처럼
 * 최근 N 건만 필요한 곳에서만 명시한다.
 */
export async function getRecentWorkouts(
  db: SQLiteDatabase,
  limit?: number
): Promise<WorkoutWithDetails[]> {
  const order = 'ORDER BY w.workout_date DESC, w.created_at DESC';
  const rows = limit === undefined
    ? await db.getAllAsync<Record<string, unknown>>(
        `SELECT ${WORKOUT_COLUMNS} ${WORKOUT_JOINS} ${order}`
      )
    : await db.getAllAsync<Record<string, unknown>>(
        `SELECT ${WORKOUT_COLUMNS} ${WORKOUT_JOINS} ${order} LIMIT ?`,
        limit
      );
  return rows.map(mapRow);
}

export async function getWorkoutsBySport(
  db: SQLiteDatabase,
  sport: string,
  limit = 50
): Promise<WorkoutWithDetails[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT ${WORKOUT_COLUMNS} ${WORKOUT_JOINS}
     WHERE w.sport_type = ?
     ORDER BY w.workout_date DESC, w.created_at DESC
     LIMIT ?`,
    sport,
    limit
  );
  return rows.map(mapRow);
}

export async function getWorkoutsInRange(
  db: SQLiteDatabase,
  fromDate: string,
  toDate: string
): Promise<WorkoutWithDetails[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT ${WORKOUT_COLUMNS} ${WORKOUT_JOINS}
     WHERE w.workout_date >= ? AND w.workout_date <= ?
     ORDER BY w.workout_date DESC, w.created_at DESC`,
    fromDate,
    toDate
  );
  return rows.map(mapRow);
}

/** 설정 화면의 저장 현황에 쓴다. 목록을 다 읽지 않고 개수만 센다. */
export async function getWorkoutCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workouts'
  );
  return row?.count ?? 0;
}
export async function deleteWorkout(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}

export async function updateAIAnalysis(
  db: SQLiteDatabase,
  id: number,
  analysisJson: string
): Promise<void> {
  await db.runAsync(
    'UPDATE workouts SET ai_analysis = ? WHERE id = ?',
    analysisJson,
    id
  );
}

export async function getWeeklyStats(
  db: SQLiteDatabase,
  weekStart?: string
): Promise<WeeklyStats> {
  const start = weekStart ?? getWeekStartKST();
  const end = new Date(new Date(start + 'T00:00:00+09:00').getTime() + 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const rows = await db.getAllAsync<{
    sport_type: string;
    total_distance: number;
    total_duration: number;
    count: number;
  }>(
    `SELECT sport_type,
            SUM(distance_m) as total_distance,
            SUM(duration_sec) as total_duration,
            COUNT(*) as count
     FROM workouts
     WHERE workout_date >= ? AND workout_date <= ?
     GROUP BY sport_type`,
    start,
    end
  );

  const stats: WeeklyStats = {
    run_distance_m: 0,
    swim_distance_m: 0,
    bike_distance_m: 0,
    total_duration_sec: 0,
    workout_count: 0,
  };

  for (const row of rows) {
    if (row.sport_type === 'running') stats.run_distance_m = row.total_distance;
    else if (row.sport_type === 'swimming') stats.swim_distance_m = row.total_distance;
    else if (row.sport_type === 'cycling') stats.bike_distance_m = row.total_distance;
    stats.total_duration_sec += row.total_duration;
    stats.workout_count += row.count;
  }

  return stats;
}
