export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface PostWorkoutAnalysis {
  headline: string;
  performance: string;
  recovery: string;
  nextFocus: string;
  warning: string | null;
}

export interface InjuryRiskAssessment {
  overallRisk: number;
  concerns: string[];
  recommendations: string[];
  summary: string;
}

export interface TrainingPlanWeek {
  weekNumber: number;
  focus: string;
  sessions: Array<{
    day: string;
    sport: string;
    type: string;
    duration: string;
    description: string;
  }>;
}

export interface TrainingPlan {
  title: string;
  totalWeeks: number;
  weeks: TrainingPlanWeek[];
}

export type AIConvType = 'coaching' | 'injury' | 'plan' | 'analysis' | 'tip';
