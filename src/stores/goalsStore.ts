import { create } from 'zustand';
import { type SQLiteDatabase } from 'expo-sqlite';
import { type Goal, type NewGoal } from '../types';
import {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  completeGoal,
  syncGoalProgress,
} from '../db/queries/goals';

interface GoalsState {
  goals: Goal[];
  isLoading: boolean;
  loadGoals: (db: SQLiteDatabase) => Promise<void>;
  createGoal: (db: SQLiteDatabase, goal: NewGoal) => Promise<void>;
  updateGoal: (db: SQLiteDatabase, id: number, goal: NewGoal) => Promise<void>;
  deleteGoal: (db: SQLiteDatabase, id: number) => Promise<void>;
  syncProgress: (db: SQLiteDatabase) => Promise<void>;
  /** 레이스 목표를 완주 처리한다 (자동 판정이 불가능한 유형). */
  markComplete: (db: SQLiteDatabase, id: number) => Promise<void>;
  progressPercent: (goal: Goal) => number;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  isLoading: false,

  loadGoals: async (db) => {
    set({ isLoading: true });
    const goals = await getAllGoals(db);
    set({ goals, isLoading: false });
  },

  createGoal: async (db, goal) => {
    await createGoal(db, goal);
    const goals = await getAllGoals(db);
    set({ goals });
  },

  updateGoal: async (db, id, goal) => {
    await updateGoal(db, id, goal);
    const goals = await getAllGoals(db);
    set({ goals });
  },

  deleteGoal: async (db, id) => {
    await deleteGoal(db, id);
    const goals = await getAllGoals(db);
    set({ goals });
  },

  markComplete: async (db, id) => {
    await completeGoal(db, id);
    const goals = await getAllGoals(db);
    set({ goals });
  },

  syncProgress: async (db) => {
    await syncGoalProgress(db);
    const goals = await getAllGoals(db);
    set({ goals });
  },

  progressPercent: (goal) => {
    if (goal.target_value === 0) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  },
}));
