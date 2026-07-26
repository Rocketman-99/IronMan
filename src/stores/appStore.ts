import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AI_LIMITS } from '../config/api';
import { API_KEY_STORAGE_KEY, saveAPIKey } from '../services/ai/client';
import { getTodayKST } from '../utils/formatters';

const MODEL_COSTS: Record<string, number> = {
  haiku: AI_LIMITS.haikuCost,
  sonnet: AI_LIMITS.sonnetCost,
};

interface AppState {
  isInitialized: boolean;
  hasApiKey: boolean;
  aiCallsToday: number;
  aiCallsDate: string;
  initialize: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  checkAndIncrementAIUsage: (model: string | number) => boolean;
  refreshApiKeyStatus: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isInitialized: false,
  hasApiKey: false,
  aiCallsToday: 0,
  aiCallsDate: '',

  initialize: async () => {
    const apiKey = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY).catch(() => null);
    set({ isInitialized: true, hasApiKey: !!apiKey, aiCallsToday: 0, aiCallsDate: getTodayKST() });
  },

  setApiKey: async (key: string) => {
    await saveAPIKey(key);
    set({ hasApiKey: true });
  },

  clearApiKey: async () => {
    await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY).catch(() => {});
    set({ hasApiKey: false });
  },

  checkAndIncrementAIUsage: (model) => {
    const cost = typeof model === 'number' ? model : (MODEL_COSTS[model] ?? 0.5);
    const state = get();
    const today = getTodayKST();
    const calls = state.aiCallsDate === today ? state.aiCallsToday : 0;
    if (calls + cost > AI_LIMITS.dailyBudget) return false;
    set({ aiCallsToday: calls + cost, aiCallsDate: today });
    return true;
  },

  refreshApiKeyStatus: async () => {
    const apiKey = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY).catch(() => null);
    set({ hasApiKey: !!apiKey });
  },
}));
