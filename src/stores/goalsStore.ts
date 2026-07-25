import { create } from 'zustand';
import { type SQLiteDatabase } from 'expo-sqlite';
import { type Goal, type NewGoal } from '../types';
import {
  getAllGoals,
  createGoal,
  deleteGoal,
  syncGoalProgress,
} from '../db/queries/goals';

interface GoalsState {
  goals: Goal[];
  isLoading: boolean;
  loadGoals: (db: SQLiteDatabase) => Promise<void>;
  createGoal: (db: SQLiteDatabase, goal: NewGoal) => Promise<void>;
  deleteGoal: (db: SQLiteDatabase, id: number) => Promise<void>;
  syncProgress: (db: SQLiteDatabase) => Promise<void>;
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

  deleteGoal: async (db, id) => {
    await deleteGoal(db, id);
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
