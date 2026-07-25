import { SportType } from './workout';

export type GoalType = 'distance' | 'pace' | 'time' | 'frequency' | 'race';
export type GoalPeriod = 'weekly' | 'monthly' | 'total' | 'race';

export interface Goal {
  id: number;
  sport_type: SportType | 'general';
  goal_type: GoalType;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  period: GoalPeriod | null;
  target_date: string | null;
  is_completed: number;
  completed_at: string | null;
  created_at: string;
}

export interface NewGoal {
  sport_type: SportType | 'general';
  goal_type: GoalType;
  title: string;
  target_value: number;
  unit: string;
  period?: GoalPeriod;
  target_date?: string;
}
