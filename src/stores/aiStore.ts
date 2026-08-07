import { create } from 'zustand';
import { t } from '../i18n/ko';
import { type SQLiteDatabase } from 'expo-sqlite';
import { type Message, type InjuryRiskAssessment, type TrainingPlan, type UserProfile, type SportType } from '../types';
import { getDailyTip } from '../services/ai/dailyTip';
import { sendChatMessage } from '../services/ai/chat';
import { assessInjuryRisk } from '../services/ai/injuryRisk';
import { generateTrainingPlan } from '../services/ai/trainingPlan';
import { buildTrainingContext, ALL_SPORTS, type TrainingContext } from '../services/ai/context';
import { analyzeWorkout } from '../services/ai/postWorkoutAnalysis';
import { getRecentWorkouts, updateAIAnalysis, getWorkoutById, getWorkoutsBySport } from '../db/queries/workouts';
import {
  SETTING_KEYS,
  getJsonSetting,
  setJsonSetting,
  saveConversation,
  getLatestConversation,
  deleteConversations,
} from '../db/queries/ai-logs';
import {
  saveTrainingPlan,
  getTrainingPlans,
  deleteTrainingPlan,
  type StoredPlan,
} from '../db/queries/trainingPlans';
import { getTodayKST, getNowKST } from '../utils/formatters';

interface AIState {
  dailyTip: string | null;
  dailyTipDate: string | null;
  injuryAssessment: InjuryRiskAssessment | null;
  /** 부상 평가를 만든 시각. 언제 본 판단인지 화면에 같이 보여준다. */
  injuryAssessedAt: string | null;
  /** 보관 중인 계획 전부. 사용자가 지울 때까지 남는다. */
  plans: StoredPlan[];
  chatMessages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  lastError: string | null;
  /** 깊은 분석 진행 상태 — 화면의 진행 표시가 읽는다. */
  progressChars: number;
  startedAt: number | null;
  /** 이번 생성에 실제로 투입된 근거. 결과 화면의 "고려한 정보"에 쓴다. */
  lastContext: TrainingContext | null;

  /** 앱을 켤 때 DB 에 남아 있는 결과를 되살린다. */
  hydrate: (db: SQLiteDatabase) => Promise<void>;
  loadPlans: (db: SQLiteDatabase) => Promise<void>;
  removePlan: (db: SQLiteDatabase, id: number) => Promise<void>;
  fetchDailyTip: (db: SQLiteDatabase, profile: UserProfile | null) => Promise<void>;
  sendChat: (db: SQLiteDatabase, text: string, profile: UserProfile | null) => Promise<void>;
  fetchInjuryRisk: (db: SQLiteDatabase, profile: UserProfile | null) => Promise<void>;
  /** `focus`: 이번 계획에서 집중할 종목. 생략하면 3종 전부로 본다. */
  generatePlan: (db: SQLiteDatabase, profile: UserProfile | null, focus?: SportType[]) => Promise<void>;
  analyzeWorkoutAI: (db: SQLiteDatabase, workoutId: number, profile: UserProfile | null) => Promise<void>;

  setDailyTip: (tip: string, date: string) => void;
  addUserMessage: (content: string) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: () => void;
  startStream: () => void;
  clearChat: (db?: SQLiteDatabase) => void;
  setError: (error: string | null) => void;
}

const FALLBACK_PROFILE: UserProfile = {
  id: 1, name: t.aiPrompt.fallbackName, birth_date: null, gender: null,
  height_cm: null, weight_kg: null, fitness_level: 'beginner',
  primary_goal: null, target_race_date: null, weekly_hours: 5,
  resting_hr: null, max_hr: null, plan_focus_sports: null, onboarding_done: 1,
  created_at: '', updated_at: '',
};

export const useAIStore = create<AIState>((set, get) => ({
  dailyTip: null,
  dailyTipDate: null,
  injuryAssessment: null,
  injuryAssessedAt: null,
  plans: [],
  chatMessages: [],
  isStreaming: false,
  isLoading: false,
  progressChars: 0,
  startedAt: null,
  lastContext: null,
  lastError: null,

  setDailyTip: (tip, date) => set({ dailyTip: tip, dailyTipDate: date }),

  hydrate: async (db) => {
    const [plans, injury, tip, chat] = await Promise.all([
      getTrainingPlans(db),
      getJsonSetting<{ assessment: InjuryRiskAssessment; at: string }>(db, SETTING_KEYS.injuryAssessment),
      getJsonSetting<{ tip: string; date: string }>(db, SETTING_KEYS.dailyTip),
      getLatestConversation(db, 'coaching'),
    ]);
    set({
      plans,
      injuryAssessment: injury?.assessment ?? null,
      injuryAssessedAt: injury?.at ?? null,
      dailyTip: tip?.tip ?? null,
      dailyTipDate: tip?.date ?? null,
      chatMessages: chat,
    });
  },

  loadPlans: async (db) => {
    set({ plans: await getTrainingPlans(db) });
  },

  removePlan: async (db, id) => {
    await deleteTrainingPlan(db, id);
    set({ plans: await getTrainingPlans(db) });
  },

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
  clearChat: (db) => {
    set({ chatMessages: [], isStreaming: false, lastError: null });
    // 저장분까지 지워야 다시 들어왔을 때 되살아나지 않는다.
    if (db) deleteConversations(db, 'coaching').catch(() => {});
  },
  setError: (error) => set({ lastError: error, isStreaming: false, isLoading: false }),

  fetchDailyTip: async (db, profile) => {
    if (!profile) return;
    const today = getTodayKST();
    if (get().dailyTipDate === today) return;
    try {
      const workouts = await getRecentWorkouts(db, 7);
      const tip = await getDailyTip(profile, workouts);
      set({ dailyTip: tip, dailyTipDate: today });
      // 날짜까지 남겨야 재시작 후에도 "하루 한 번"이 지켜진다.
      await setJsonSetting(db, SETTING_KEYS.dailyTip, { tip, date: today });
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
      // 한 턴이 끝날 때마다 대화 전체를 최신 상태로 남긴다.
      await saveConversation(db, 'coaching', get().chatMessages);
    } catch (e) {
      get().setError(String(e));
    }
  },

  fetchInjuryRisk: async (db, profile) => {
    if (!profile) return;
    set({ isLoading: true, progressChars: 0, startedAt: Date.now() });
    try {
      const context = await buildTrainingContext(db, profile);
      set({ lastContext: context });
      const assessment = await assessInjuryRisk(profile, context, (n) =>
        set({ progressChars: n })
      );
      const at = getNowKST();
      set({ injuryAssessment: assessment, injuryAssessedAt: at, isLoading: false, startedAt: null });
      await setJsonSetting(db, SETTING_KEYS.injuryAssessment, { assessment, at });
    } catch (e) {
      set({ lastError: String(e), isLoading: false, startedAt: null });
    }
  },

  generatePlan: async (db, profile, focus) => {
    if (!profile) return;
    set({ isLoading: true, progressChars: 0, startedAt: Date.now() });
    try {
      const context = await buildTrainingContext(db, profile, focus ?? ALL_SPORTS);
      set({ lastContext: context });
      const plan = await generateTrainingPlan(profile, context, (n) =>
        set({ progressChars: n })
      );
      await saveTrainingPlan(db, plan, {
        focusSports: (focus ?? ALL_SPORTS).join(','),
        considered: context.considered,
      });
      set({ plans: await getTrainingPlans(db), isLoading: false, startedAt: null });
    } catch (e) {
      set({ lastError: String(e), isLoading: false, startedAt: null });
    }
  },

  analyzeWorkoutAI: async (db, workoutId, profile) => {
    if (!profile) return;
    try {
      const workout = await getWorkoutById(db, workoutId);
      if (!workout) return;
      const recentSameSport = await getWorkoutsBySport(db, workout.sport_type, 5);
      const result = await analyzeWorkout(workout, recentSameSport, profile);
      await updateAIAnalysis(db, workoutId, JSON.stringify(result));
    } catch (e) {
      console.log('AI analysis error:', e);
    }
  },
}));
