import { type UserProfile, type WorkoutWithDetails, type Goal } from '../../types';
import {
  formatDuration,
  formatDistance,
  formatPace,
  formatWorkoutDate,
  calcAge,
} from '../../utils/formatters';
import { sportLabels, fitnessLevelLabels, raceTypeLabels } from '../../utils/theme';

export function profileSummary(profile: UserProfile): string {
  const age = profile.birth_date ? `${calcAge(profile.birth_date)}세` : '나이 미기입';
  const gender = profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : '미기입';
  const fitness = fitnessLevelLabels[profile.fitness_level] ?? profile.fitness_level;
  const race = profile.primary_goal ? raceTypeLabels[profile.primary_goal] : '미설정';
  const bmi =
    profile.height_cm && profile.weight_kg
      ? `, BMI ${(profile.weight_kg / (profile.height_cm / 100) ** 2).toFixed(1)}`
      : '';
  return `이름: ${profile.name}, ${age} ${gender}, 키 ${profile.height_cm ?? '?'}cm / 몸무게 ${profile.weight_kg ?? '?'}kg${bmi}, 피트니스 레벨: ${fitness}, 목표 레이스: ${race}`;
}

export function workoutSummary(w: WorkoutWithDetails): string {
  const date = formatWorkoutDate(w.workout_date);
  const sport = sportLabels[w.sport_type as keyof typeof sportLabels] ?? w.sport_type;
  const dist = formatDistance(w.distance_m);
  const dur = formatDuration(w.duration_sec);
  let extra = '';
  if (w.sport_type === 'running' && w.running?.avg_pace_sec_km) {
    extra = `, 페이스 ${formatPace(w.running.avg_pace_sec_km)}`;
  } else if (w.sport_type === 'cycling' && w.cycling?.avg_speed_kmh) {
    extra = `, 평균속도 ${w.cycling.avg_speed_kmh}km/h`;
  }
  const hr = w.avg_hr ? `, 평균심박 ${w.avg_hr}bpm` : '';
  const feel = w.feeling ? `, 느낌 ${w.feeling}/5` : '';
  return `[${date}] ${sport} ${dist}, ${dur}${extra}${hr}${feel}`;
}

export function buildCoachSystemPrompt(
  profile: UserProfile,
  recentWorkouts: WorkoutWithDetails[]
): string {
  const workoutLines = recentWorkouts
    .slice(0, 10)
    .map(workoutSummary)
    .join('\n');

  return `당신은 IronMan 앱의 전문 트라이애슬론 코치입니다.

사용자 프로필:
${profileSummary(profile)}

최근 운동 기록 (최신순):
${workoutLines || '기록 없음'}

지침:
- 모든 답변은 한국어로 합니다.
- 구체적이고, 격려적이며, 스포츠 과학에 기반한 조언을 제공하세요.
- 부상 방지는 스포츠 의학 원칙을 근거로 설명하세요.
- 훈련 추천 시 사용자의 피트니스 레벨(${fitnessLevelLabels[profile.fitness_level]})에 맞는 강도와 훈련 존을 적용하세요.
- 필요하면 먼저 질문을 통해 상황을 파악한 후 조언하세요.
- 답변은 명확하고 간결하게, 지나치게 길지 않게 해주세요.`;
}

export function buildPostWorkoutPrompt(
  workout: WorkoutWithDetails,
  recentSameSport: WorkoutWithDetails[],
  profile: UserProfile
): string {
  const sport = sportLabels[workout.sport_type as keyof typeof sportLabels];
  const dist = formatDistance(workout.distance_m);
  const dur = formatDuration(workout.duration_sec);
  let details = '';

  if (workout.sport_type === 'running' && workout.running) {
    const r = workout.running;
    details = `
- 페이스: ${r.avg_pace_sec_km ? formatPace(r.avg_pace_sec_km) : '미기록'}
- 케이던스: ${r.cadence_spm ?? '미기록'} spm
- 노면: ${r.surface ?? '미기록'}`;
  } else if (workout.sport_type === 'swimming' && workout.swimming) {
    const s = workout.swimming;
    details = `
- 수영장 길이: ${s.pool_length_m}m
- 켝 랩: ${s.total_laps ?? '미기록'}
- 영법: ${s.stroke_type ?? '미기록'}
- 100m 페이스: ${s.avg_pace_sec_100m ? formatPace(s.avg_pace_sec_100m) : '미기록'}`;
  } else if (workout.sport_type === 'cycling' && workout.cycling) {
    const c = workout.cycling;
    details = `
- 평균속도: ${c.avg_speed_kmh ?? '미기록'} km/h
- 평균파워: ${c.avg_power_w ?? '미기록'} W
- 케이던스: ${c.avg_cadence_rpm ?? '미기록'} rpm
- 고도상승: ${c.elevation_gain_m ?? '미기록'} m`;
  }

  const comparison =
    recentSameSport.length > 0
      ? `\n최근 ${sport} 3회:\n` + recentSameSport.slice(0, 3).map(workoutSummary).join('\n')
      : '';

  return `방금 ${sport} 훈련을 완료했습니다.

오늘의 훈련:
- 날짜: ${formatWorkoutDate(workout.workout_date)}
- 거리: ${dist}
- 시간: ${dur}
- 평균 심박수: ${workout.avg_hr ?? '미기록'} bpm
- 기온: ${workout.temp_celsius ?? '미기록'}°C / 습도: ${workout.humidity_pct ?? '미기록'}%
- 느낌: ${workout.feeling ? `${workout.feeling}/5` : '미기록'}
- 메모: ${workout.notes ?? '없음'}${details}

사용자: ${profileSummary(profile)}
${comparison}

다음 JSON 형식으로 간결하게 분석해주세요 (한국어):
{
  "headline": "한 줄 요약 (20자 이내)",
  "performance": "퍼포먼스 평가 (2문장)",
  "recovery": "회복 조언 (1문장)",
  "nextFocus": "다음 훈련 포인트 (1문장)",
  "warning": "주의 사항 (있으면 1문장, 없으면 null)"
}`;
}

export function buildDailyTipPrompt(
  profile: UserProfile,
  recentWorkouts: WorkoutWithDetails[]
): string {
  const lastThree = recentWorkouts.slice(0, 3).map(workoutSummary).join('\n');
  return `트라이애슬론 코치로서 오늘의 훈련 팁을 1~2문장으로 제공해주세요.

사용자: ${profileSummary(profile)}
최근 운동:
${lastThree || '기록 없음'}

격려적이고 실용적인 팁 한 가지를 한국어로 간결하게 작성하세요.`;
}

export function buildInjuryRiskPrompt(
  profile: UserProfile,
  last30DaysWorkouts: WorkoutWithDetails[]
): string {
  const totalWorkouts = last30DaysWorkouts.length;
  const totalDistanceKm = last30DaysWorkouts.reduce((s, w) => s + w.distance_m, 0) / 1000;
  const avgFeeling =
    last30DaysWorkouts.filter((w) => w.feeling).reduce((s, w) => s + (w.feeling ?? 0), 0) /
    (last30DaysWorkouts.filter((w) => w.feeling).length || 1);

  const last7 = last30DaysWorkouts.filter((w) => {
    const d = new Date(w.workout_date);
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d >= cutoff;
  });
  const prev7 = last30DaysWorkouts.filter((w) => {
    const d = new Date(w.workout_date);
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const cutoff2 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d >= cutoff && d < cutoff2;
  });

  const acwr =
    prev7.length > 0
      ? (last7.reduce((s, w) => s + w.distance_m, 0) /
          prev7.reduce((s, w) => s + w.distance_m, 0)).toFixed(2)
      : 'N/A';

  return `트라이애슬론 운동의학 전문가로서 부상 위험을 평가해주세요.

사용자: ${profileSummary(profile)}

최근 30일 운동 데이터:
- 켝 운동 횟수: ${totalWorkouts}회
- 켝 거리: ${totalDistanceKm.toFixed(1)}km
- 평균 느낌 점수: ${avgFeeling.toFixed(1)}/5
- 급성:만성 부하비율(ACWR): ${acwr}
- 최근 7일 운동: ${last7.length}회
- 그 이전 7일 운동: ${prev7.length}회

다음 JSON으로 응답해주세요 (한국어):
{
  "overallRisk": 0-100 사이 정수,
  "concerns": ["우려 사항1", "우려 사항2"],
  "recommendations": ["권장 조치1", "권장 조치2", "권장 조치3"],
  "summary": "종합 의견 2-3문장"
}`;
}

export function buildGoalsContext(goals: Goal[]): string {
  if (goals.length === 0) return '설정된 목표 없음';
  return goals
    .filter((g) => !g.is_completed)
    .map((g) => `- ${g.title}: ${g.current_value}/${g.target_value}${g.unit}`)
    .join('\n');
}
