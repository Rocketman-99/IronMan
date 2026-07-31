import { SportType } from './workout';
import { RaceType } from './profile';

export type GoalType = 'distance' | 'pace' | 'time' | 'frequency' | 'race';

/**
 * 목표를 어느 주기로 채우는지.
 * `once` 는 기간 제한 없이 누적으로 한 번 달성하면 되는 목표다.
 */
export type GoalPeriod = 'once' | 'weekly' | 'monthly';

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
  /** goal_type === 'race' 일 때만 채워진다. */
  race_type: RaceType | null;
  /** 레이스 당일. 목표마다 따로 가지므로 레이스 목표를 여러 개 둘 수 있다. */
  race_date: string | null;
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
  race_type?: RaceType;
  race_date?: string;
}
