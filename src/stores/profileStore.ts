import { create } from 'zustand';
import { type SQLiteDatabase } from 'expo-sqlite';
import { type UserProfile, type ProfileDraft } from '../types';
import { getProfile, upsertProfile, markOnboardingDone } from '../db/queries/profile';
import { calcAge, estimateMaxHR } from '../utils/formatters';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: (db: SQLiteDatabase) => Promise<void>;
  saveProfile: (db: SQLiteDatabase, data: Partial<ProfileDraft> & { onboarding_done?: number }) => Promise<void>;
  completeOnboarding: (db: SQLiteDatabase) => Promise<void>;
  getAge: () => number | null;
  getEffectiveMaxHR: () => number;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  loadProfile: async (db) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await getProfile(db);
      set({ profile, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  saveProfile: async (db, data) => {
    set({ isLoading: true });
    try {
      await upsertProfile(db, data);
      const profile = await getProfile(db);
      set({ profile, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  completeOnboarding: async (db) => {
    await markOnboardingDone(db);
    const profile = await getProfile(db);
    set({ profile });
  },

  getAge: () => {
    const { profile } = get();
    if (!profile?.birth_date) return null;
    return calcAge(profile.birth_date);
  },

  getEffectiveMaxHR: () => {
    const { profile } = get();
    if (profile?.max_hr) return profile.max_hr;
    if (profile?.birth_date) return estimateMaxHR(profile.birth_date);
    return 190;
  },
}));
