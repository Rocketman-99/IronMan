import { type SQLiteDatabase } from 'expo-sqlite';
import {
  type Workout,
  type WorkoutWithDetails,
  type WorkoutDraft,
  type WeeklyStats,
} from '../../types';
import { getNowKST, getWeekStartKST } from '../../utils/formatters';

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
  const workout = await db.getFirstAsync<Workout>(
    'SELECT * FROM workouts WHERE id = ?',
    id
  );
  if (!workout) return null;
  return attachDetails(db, workout);
}

export async function getRecentWorkouts(
  db: SQLiteDatabase,
  limit = 20
): Promise<WorkoutWithDetails[]> {
  const workouts = await db.getAllAsync<Workout>(
    'SELECT * FROM workouts ORDER BY workout_date DESC, created_at DESC LIMIT ?',
    limit
  );
  return Promise.all(workouts.map((w) => attachDetails(db, w)));
}

export async function getWorkoutsBySport(
  db: SQLiteDatabase,
  sport: string,
  limit = 50
): Promise<WorkoutWithDetails[]> {
  const workouts = await db.getAllAsync<Workout>(
    'SELECT * FROM workouts WHERE sport_type = ? ORDER BY workout_date DESC LIMIT ?',
    sport,
    limit
  );
  return Promise.all(workouts.map((w) => attachDetails(db, w)));
}

export async function getWorkoutsInRange(
  db: SQLiteDatabase,
  fromDate: string,
  toDate: string
): Promise<WorkoutWithDetails[]> {
  const workouts = await db.getAllAsync<Workout>(
    'SELECT * FROM workouts WHERE workout_date >= ? AND workout_date <= ? ORDER BY workout_date DESC',
    fromDate,
    toDate
  );
  return Promise.all(workouts.map((w) => attachDetails(db, w)));
}

async function attachDetails(
  db: SQLiteDatabase,
  workout: Workout
): Promise<WorkoutWithDetails> {
  const result: WorkoutWithDetails = { ...workout };
  if (workout.sport_type === 'running') {
    result.running =
      (await db.getFirstAsync(
        'SELECT * FROM running_details WHERE workout_id = ?',
        workout.id
      )) ?? undefined;
  } else if (workout.sport_type === 'swimming') {
    result.swimming =
      (await db.getFirstAsync(
        'SELECT * FROM swimming_details WHERE workout_id = ?',
        workout.id
      )) ?? undefined;
  } else if (workout.sport_type === 'cycling') {
    result.cycling =
      (await db.getFirstAsync(
        'SELECT * FROM cycling_details WHERE workout_id = ?',
        workout.id
      )) ?? undefined;
  }
  return result;
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
