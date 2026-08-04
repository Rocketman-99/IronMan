import { type SQLiteDatabase } from 'expo-sqlite';
import { type UserProfile, type WorkoutWithDetails, type Goal, type SportType } from '../../types';
import { getRecentWorkouts } from '../../db/queries/workouts';
import { getAllGoals } from '../../db/queries/goals';
import { profileSummary, workoutSummary, buildGoalsContext } from './prompts';
import { t } from '../../i18n/ko';

/**
 * 깊은 분석(훈련 계획 · 부상 평가)에 넘길 컨텍스트.
 *
 * 예전에는 프로필과 최근 운동만 넘겨서 계획이 얕았다. 목표와 추이까지 한곳에서 모아
 * 두 기능이 같은 근거를 보도록 하고, 그 근거를 화면에도 그대로 보여준다.
 */

export interface TrainingContext {
  /** 프롬프트에 넣을 텍스트 블록 */
  prompt: string;
  /** 화면의 "고려한 정보" 카드에 뿌릴 항목 */
  considered: { label: string; value: string }[];
  workoutCount: number;
  /** 계획을 만들 때 집중할 종목. 부상 평가에는 쓰지 않아 비어 있을 수 있다. */
  focus?: SportType[];
}

export const ALL_SPORTS: SportType[] = ['running', 'swimming', 'cycling'];

/** 저장된 문자열('running,cycling')을 종목 배열로. 비었거나 이상하면 3종 전부. */
export function parseFocus(stored: string | null | undefined): SportType[] {
  const parsed = (stored ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is SportType => (ALL_SPORTS as string[]).includes(s));
  return parsed.length > 0 ? parsed : ALL_SPORTS;
}

function weekBucket(workouts: WorkoutWithDetails[], startDaysAgo: number, endDaysAgo: number) {
  const now = Date.now();
  const from = now - startDaysAgo * 86400000;
  const to = now - endDaysAgo * 86400000;
  return workouts.filter((w) => {
    const d = new Date(w.workout_date).getTime();
    return d >= from && d < to;
  });
}

function km(workouts: WorkoutWithDetails[]): number {
  return workouts.reduce((s, w) => s + w.distance_m, 0) / 1000;
}

/**
 * 급성:만성 부하비율. 최근 7일 거리를 그 이전 7일 거리로 나눈 값으로,
 * 1.5를 넘으면 훈련량을 급하게 늘린 것으로 본다.
 */
function acwr(workouts: WorkoutWithDetails[]): number | null {
  const last7 = km(weekBucket(workouts, 7, 0));
  const prev7 = km(weekBucket(workouts, 14, 7));
  if (prev7 <= 0) return null;
  return Number((last7 / prev7).toFixed(2));
}

export async function buildTrainingContext(
  db: SQLiteDatabase,
  profile: UserProfile,
  /** 훈련 계획에서만 넘긴다. 부상 평가는 종목을 좁힐 이유가 없다. */
  focus?: SportType[]
): Promise<TrainingContext> {
  const workouts = await getRecentWorkouts(db, 30);
  const goals = await getAllGoals(db);
  const activeGoals = goals.filter((g) => !g.is_completed);

  const ratio = acwr(workouts);
  const weeks = [0, 1, 2, 3].map((i) => ({
    label: `${i + 1}주 전`,
    km: km(weekBucket(workouts, (i + 1) * 7, i * 7)),
    count: weekBucket(workouts, (i + 1) * 7, i * 7).length,
  }));

  const bySport = (['running', 'swimming', 'cycling'] as const).map((s) => ({
    sport: t.sport[s],
    count: workouts.filter((w) => w.sport_type === s).length,
    km: km(workouts.filter((w) => w.sport_type === s)),
  }));

  const feelings = workouts.filter((w) => w.feeling);
  const avgFeeling = feelings.length
    ? feelings.reduce((s, w) => s + (w.feeling ?? 0), 0) / feelings.length
    : null;

  const prompt = `사용자 프로필:
${profileSummary(profile)}

설정한 목표:
${buildGoalsContext(goals)}

최근 30일 훈련량 추이 (최신 주부터):
${weeks.map((w) => `- ${w.label}: ${w.count}회, ${w.km.toFixed(1)}km`).join('\n')}

종목 균형 (최근 30일):
${bySport.map((s) => `- ${s.sport}: ${s.count}회, ${s.km.toFixed(1)}km`).join('\n')}

부하 지표:
- 급성:만성 부하비율(ACWR): ${ratio ?? '데이터 부족'}
- 평균 컨디션 점수: ${avgFeeling ? `${avgFeeling.toFixed(1)}/5` : '기록 없음'}

최근 운동 (최신 10건):
${workouts.slice(0, 10).map(workoutSummary).join('\n') || '기록 없음'}${
    focus ? `\n\n사용자가 이번 계획에서 집중하기로 고른 종목: ${focus.map((s) => t.sport[s]).join(', ')}` : ''
  }`;

  const considered: { label: string; value: string }[] = [
    { label: t.aiContext.workouts, value: `${workouts.length}건 (최근 30일)` },
    { label: t.aiContext.goals, value: `${activeGoals.length}개` },
    {
      label: t.aiContext.trend,
      value: `${weeks[0].km.toFixed(1)}km → ${weeks[3].km.toFixed(1)}km`,
    },
    { label: t.aiContext.acwr, value: ratio !== null ? String(ratio) : t.common.noData },
    {
      label: t.aiContext.condition,
      value: avgFeeling ? `${avgFeeling.toFixed(1)}/5` : t.common.notRecorded,
    },
    {
      label: t.aiContext.profile,
      value: `${t.fitnessLevel[profile.fitness_level]} · 주 ${profile.weekly_hours}시간`,
    },
  ];

  if (focus) {
    considered.unshift({
      label: t.aiContext.focus,
      value: focus.map((s) => t.sport[s]).join(', '),
    });
  }

  return { prompt, considered, workoutCount: workouts.length, focus };
}
