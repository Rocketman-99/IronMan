export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type Gender = 'male' | 'female' | 'other';
/** 트라이애슬론 4종 + 마라톤 5종. 목표 탭에서 여러 개 선택할 수 있다. */
export type RaceType =
  | 'sprint'
  | 'olympic'
  | 'half_ironman'
  | 'full_ironman'
  | 'marathon_5k'
  | 'marathon_10k'
  | 'half_marathon'
  | 'full_marathon'
  | 'ultra';

export interface UserProfile {
  id: number;
  name: string;
  birth_date: string | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_level: FitnessLevel;
  primary_goal: RaceType | null;
  target_race_date: string | null;
  weekly_hours: number;
  resting_hr: number | null;
  max_hr: number | null;
  onboarding_done: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileDraft {
  name: string;
  birth_date?: string;
  gender?: Gender;
  height_cm?: number;
  weight_kg?: number;
  fitness_level: FitnessLevel;
  primary_goal?: RaceType;
  target_race_date?: string;
  weekly_hours: number;
  resting_hr?: number;
  max_hr?: number;
}
