import { create } from 'zustand';
import { type SQLiteDatabase } from 'expo-sqlite';
import {
  type WorkoutWithDetails,
  type WorkoutDraft,
  type WeeklyStats,
} from '../types';
import {
  getRecentWorkouts,
  saveWorkout,
  deleteWorkout,
  getWeeklyStats,
  updateAIAnalysis,
} from '../db/queries/workouts';

interface WorkoutState {
  recentWorkouts: WorkoutWithDetails[];
  weeklyStats: WeeklyStats;
  isLoading: boolean;
  loadRecentWorkouts: (db: SQLiteDatabase) => Promise<void>;
  loadWeeklyStats: (db: SQLiteDatabase) => Promise<void>;
  saveWorkout: (db: SQLiteDatabase, draft: WorkoutDraft) => Promise<number>;
  deleteWorkout: (db: SQLiteDatabase, id: number) => Promise<void>;
  updateAIAnalysis: (db: SQLiteDatabase, id: number, json: string) => Promise<void>;
  refreshAll: (db: SQLiteDatabase) => Promise<void>;
}

const emptyStats: WeeklyStats = {
  run_distance_m: 0,
  swim_distance_m: 0,
  bike_distance_m: 0,
  total_duration_sec: 0,
  workout_count: 0,
};

/**
 * 목록은 상한 없이 전부 읽는다.
 *
 * 예전에는 `getRecentWorkouts` 의 기본 상한 20 이 그대로 걸려, 21번째부터는
 * DB 에 있는데도 히스토리·성장·대시보드에 나오지 않았다. 상세를 LEFT JOIN 으로
 * 접어 쿼리가 1회로 고정됐으므로 건수가 늘어도 왕복이 늘지 않는다.
 */
export const useWorkoutStore = create<WorkoutState>((set) => ({
  recentWorkouts: [],
  weeklyStats: emptyStats,
  isLoading: false,

  loadRecentWorkouts: async (db) => {
    set({ isLoading: true });
    const workouts = await getRecentWorkouts(db);
    set({ recentWorkouts: workouts, isLoading: false });
  },

  loadWeeklyStats: async (db) => {
    const stats = await getWeeklyStats(db);
    set({ weeklyStats: stats });
  },

  saveWorkout: async (db, draft) => {
    const id = await saveWorkout(db, draft);
    const workouts = await getRecentWorkouts(db);
    const stats = await getWeeklyStats(db);
    set({ recentWorkouts: workouts, weeklyStats: stats });
    return id;
  },

  deleteWorkout: async (db, id) => {
    await deleteWorkout(db, id);
    const workouts = await getRecentWorkouts(db);
    const stats = await getWeeklyStats(db);
    set({ recentWorkouts: workouts, weeklyStats: stats });
  },

  updateAIAnalysis: async (db, id, json) => {
    await updateAIAnalysis(db, id, json);
    set((state) => ({
      recentWorkouts: state.recentWorkouts.map((w) =>
        w.id === id ? { ...w, ai_analysis: json } : w
      ),
    }));
  },

  refreshAll: async (db) => {
    const [workouts, stats] = await Promise.all([
      getRecentWorkouts(db),
      getWeeklyStats(db),
    ]);
    set({ recentWorkouts: workouts, weeklyStats: stats });
  },
}));
