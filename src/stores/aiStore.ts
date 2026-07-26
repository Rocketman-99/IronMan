import { create } from 'zustand';
import { type SQLiteDatabase } from 'expo-sqlite';
import { type Message, type InjuryRiskAssessment, type TrainingPlan, type UserProfile } from '../types';
import { getDailyTip } from '../services/ai/dailyTip';
import { sendChatMessage } from '../services/ai/chat';
import { assessInjuryRisk } from '../services/ai/injuryRisk';
import { generateTrainingPlan } from '../services/ai/trainingPlan';
import { analyzeWorkout } from '../services/ai/postWorkoutAnalysis';
import { getRecentWorkouts, updateAIAnalysis, getWorkoutById } from '../db/queries/workouts';
import { getTodayKST } from '../utils/formatters';

interface AIState {
  dailyTip: string | null;
  dailyTipDate: string | null;
  injuryAssessment: InjuryRiskAssessment | null;
  trainingPlan: TrainingPlan | null;
  chatMessages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  lastError: string | null;

  fetchDailyTip: (db: SQLiteDatabase, profile: UserProfile | null) => Promise<void>;
  sendChat: (db: SQLiteDatabase, text: string, profile: UserProfile | null) => Promise<void>;
  fetchInjuryRisk: (db: SQLiteDatabase, profile: UserProfile | null) => Promise<void>;
  generatePlan: (db: SQLiteDatabase, profile: UserProfile | null) => Promise<void>;
  analyzeWorkoutAI: (db: SQLiteDatabase, workoutId: number, profile: UserProfile | null) => Promise<void>;

  setDailyTip: (tip: string, date: string) => void;
  addUserMessage: (content: string) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: () => void;
  startStream: () => void;
  clearChat: () => void;
  setError: (error: string | null) => void;
}

const FALLBACK_PROFILE: UserProfile = {
  id: 1, name: '트레이니', birth_date: null, gender: null,
  height_cm: null, weight_kg: null, fitness_level: 'beginner',
  primary_goal: null, target_race_date: null, weekly_hours: 5,
  resting_hr: null, max_hr: null, onboarding_done: 1,
  created_at: '', updated_at: '',
};

export const useAIStore = create<AIState>((set, get) => ({
  dailyTip: null,
  dailyTipDate: null,
  injuryAssessment: null,
  trainingPlan: null,
  chatMessages: [],
  isStreaming: false,
  isLoading: false,
  lastError: null,

  setDailyTip: (tip, date) => set({ dailyTip: tip, dailyTipDate: date }),

  addUserMessage: (content) =>
    set((state) => ({ chatMessages: [...state.chatMessages, { role: 'user', content }] })),

  startStream: () =>
    set((state) => ({
      isStreaming: true,
      chatMessages: [...state.chatMessages, { role: 'assistant', content: '' }],
    })),

  appendStreamChunk: (chunk) =>
    set((state) => {
      const messages = [...state.chatMessages];
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + chunk };
      }
      return { chatMessages: messages };
    }),

  finalizeStream: () => set({ isStreaming: false }),
  clearChat: () => set({ chatMessages: [], isStreaming: false, lastError: null }),
  setError: (error) => set({ lastError: error, isStreaming: false, isLoading: false }),

  fetchDailyTip: async (db, profile) => {
    if (!profile) return;
    const today = getTodayKST();
    if (get().dailyTipDate === today) return;
    try {
      const workouts = await getRecentWorkouts(db, 7);
      const tip = await getDailyTip(profile, workouts);
      set({ dailyTip: tip, dailyTipDate: today });
    } catch (e) {
      set({ lastError: String(e) });
    }
  },

  sendChat: async (db, text, profile) => {
    const safeProfile = profile ?? FALLBACK_PROFILE;
    get().addUserMessage(text);
    get().startStream();
    try {
      const workouts = await getRecentWorkouts(db, 14);
      const messages = get().chatMessages.slice(0, -1);
      await sendChatMessage(messages, safeProfile, workouts, get().appendStreamChunk);
      get().finalizeStream();
    } catch (e) {
      get().setError(String(e));
    }
  },

  fetchInjuryRisk: async (db, profile) => {
    if (!profile) return;
    set({ isLoading: true });
    try {
      const workouts = await getRecentWorkouts(db, 30);
      const assessment = await assessInjuryRisk(profile, workouts);
      set({ injuryAssessment: assessment, isLoading: false });
    } catch (e) {
      set({ lastError: String(e), isLoading: false });
    }
  },

  generatePlan: async (db, profile) => {
    if (!profile) return;
    set({ isLoading: true });
    try {
      const workouts = await getRecentWorkouts(db, 14);
      const plan = await generateTrainingPlan(profile, workouts);
      set({ trainingPlan: plan, isLoading: false });
    } catch (e) {
      set({ lastError: String(e), isLoading: false });
    }
  },

  analyzeWorkoutAI: async (db, workoutId, profile) => {
    if (!profile) return;
    try {
      const workout = await getWorkoutById(db, workoutId);
      if (!workout) return;
      const result = await analyzeWorkout(workout, profile);
      await updateAIAnalysis(db, workoutId, JSON.stringify(result));
    } catch (e) {
      console.log('AI analysis error:', e);
    }
  },
}));
