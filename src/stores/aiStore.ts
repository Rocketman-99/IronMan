import { create } from 'zustand';
import { type Message, type InjuryRiskAssessment } from '../types';

interface AIState {
  dailyTip: string | null;
  dailyTipDate: string | null;
  injuryAssessment: InjuryRiskAssessment | null;
  chatMessages: Message[];
  isStreaming: boolean;
  lastError: string | null;
  setDailyTip: (tip: string, date: string) => void;
  setInjuryAssessment: (assessment: InjuryRiskAssessment) => void;
  addUserMessage: (content: string) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: () => void;
  startStream: () => void;
  clearChat: () => void;
  setError: (error: string | null) => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  dailyTip: null,
  dailyTipDate: null,
  injuryAssessment: null,
  chatMessages: [],
  isStreaming: false,
  lastError: null,

  setDailyTip: (tip, date) => set({ dailyTip: tip, dailyTipDate: date }),

  setInjuryAssessment: (assessment) => set({ injuryAssessment: assessment }),

  addUserMessage: (content) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, { role: 'user', content }],
    })),

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
        messages[messages.length - 1] = {
          ...last,
          content: last.content + chunk,
        };
      }
      return { chatMessages: messages };
    }),

  finalizeStream: () => set({ isStreaming: false }),

  clearChat: () => set({ chatMessages: [], isStreaming: false, lastError: null }),

  setError: (error) => set({ lastError: error, isStreaming: false }),
}));
