export type SportType = 'running' | 'swimming' | 'cycling';

export interface Workout {
  id: number;
  sport_type: SportType;
  workout_date: string;
  duration_sec: number;
  distance_m: number;
  calories: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  feeling: number | null;
  notes: string | null;
  temp_celsius: number | null;
  humidity_pct: number | null;
  ai_analysis: string | null;
  created_at: string;
}

export interface RunningDetails {
  id: number;
  workout_id: number;
  avg_pace_sec_km: number | null;
  best_pace_sec_km: number | null;
  cadence_spm: number | null;
  elevation_gain_m: number | null;
  surface: string | null;
}

export interface SwimmingDetails {
  id: number;
  workout_id: number;
  pool_length_m: number;
  total_laps: number | null;
  avg_pace_sec_100m: number | null;
  stroke_type: string | null;
  stroke_rate: number | null;
  swolf: number | null;
}

export interface CyclingDetails {
  id: number;
  workout_id: number;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  avg_power_w: number | null;
  max_power_w: number | null;
  avg_cadence_rpm: number | null;
  elevation_gain_m: number | null;
  bike_type: string | null;
}

export interface WorkoutWithDetails extends Workout {
  running?: RunningDetails;
  swimming?: SwimmingDetails;
  cycling?: CyclingDetails;
}

export interface RunningDraft {
  avg_pace_sec_km?: number | null;
  best_pace_sec_km?: number | null;
  cadence_spm?: number | null;
  elevation_gain_m?: number | null;
  surface?: string | null;
}

export interface SwimmingDraft {
  pool_length_m?: number;
  total_laps?: number | null;
  avg_pace_sec_100m?: number | null;
  stroke_type?: string | null;
  stroke_rate?: number | null;
  swolf?: number | null;
}

export interface CyclingDraft {
  avg_speed_kmh?: number | null;
  max_speed_kmh?: number | null;
  avg_power_w?: number | null;
  max_power_w?: number | null;
  avg_cadence_rpm?: number | null;
  elevation_gain_m?: number | null;
  bike_type?: string | null;
}

export interface WorkoutDraft {
  sport_type: SportType;
  workout_date: string;
  duration_sec: number;
  distance_m: number;
  calories?: number | null;
  avg_hr?: number | null;
  max_hr?: number | null;
  feeling?: number | null;
  notes?: string | null;
  temp_celsius?: number | null;
  humidity_pct?: number | null;
  running?: RunningDraft;
  swimming?: SwimmingDraft;
  cycling?: CyclingDraft;
}

export interface WeeklyStats {
  run_distance_m: number;
  swim_distance_m: number;
  bike_distance_m: number;
  total_duration_sec: number;
  workout_count: number;
}
