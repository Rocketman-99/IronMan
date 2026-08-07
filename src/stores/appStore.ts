import { create } from 'zustand';
import { type SQLiteDatabase } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { AI_LIMITS } from '../config/api';
import { API_KEY_STORAGE_KEY, saveAPIKey } from '../services/ai/client';
import { SETTING_KEYS, getJsonSetting, setJsonSetting } from '../db/queries/ai-logs';
import { getTodayKST } from '../utils/formatters';

const MODEL_COSTS: Record<string, number> = {
  fast: AI_LIMITS.fastCost,
  deep: AI_LIMITS.deepCost,
};

interface AppState {
  isInitialized: boolean;
  hasApiKey: boolean;
  aiCallsToday: number;
  aiCallsDate: string;
  initialize: (db: SQLiteDatabase) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  /**
   * 한도를 넘지 않으면 사용량을 올리고 true.
   *
   * `db` 를 넘기면 사용량을 기기에 남겨 재시작 후에도 한도가 이어진다.
   * 저장은 기다리지 않는다 — AI 호출을 여기서 늦출 이유가 없다.
   */
  checkAndIncrementAIUsage: (model: string | number, db?: SQLiteDatabase) => boolean;
  refreshApiKeyStatus: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isInitialized: false,
  hasApiKey: false,
  aiCallsToday: 0,
  aiCallsDate: '',

  initialize: async (db) => {
    const apiKey = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY).catch(() => null);
    const today = getTodayKST();
    // 사용량이 메모리에만 있던 탓에 앱을 켤 때마다 0 이 됐고, 설정 화면의
    // "오늘 AI 사용량"이 실제와 어긋났으며 일일 한도가 사실상 걸리지 않았다.
    const saved = await getJsonSetting<{ date: string; points: number }>(db, SETTING_KEYS.aiUsage);
    const points = saved?.date === today ? saved.points : 0;
    set({ isInitialized: true, hasApiKey: !!apiKey, aiCallsToday: points, aiCallsDate: today });
  },

  setApiKey: async (key: string) => {
    await saveAPIKey(key);
    set({ hasApiKey: true });
  },

  clearApiKey: async () => {
    await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY).catch(() => {});
    set({ hasApiKey: false });
  },

  checkAndIncrementAIUsage: (model, db) => {
    const cost = typeof model === 'number' ? model : (MODEL_COSTS[model] ?? 0.5);
    const state = get();
    const today = getTodayKST();
    const calls = state.aiCallsDate === today ? state.aiCallsToday : 0;
    if (calls + cost > AI_LIMITS.dailyBudget) return false;
    const points = calls + cost;
    set({ aiCallsToday: points, aiCallsDate: today });
    if (db) setJsonSetting(db, SETTING_KEYS.aiUsage, { date: today, points }).catch(() => {});
    return true;
  },

  refreshApiKeyStatus: async () => {
    const apiKey = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY).catch(() => null);
    set({ hasApiKey: !!apiKey });
  },
}));
