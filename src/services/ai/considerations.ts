import { t } from '../../i18n/ko';

/**
 * 생성을 누르기 **전에** 보여줄 안내 — 어떤 정보를 볼 것인지.
 *
 * 생성 후에는 `TrainingContext.considered` 가 실제 투입값(운동 N건, ACWR 등)으로
 * 같은 자리를 대체한다. 여기 항목은 그 예고편이라 값 대신 설명이 들어간다.
 */

export const PLAN_CONSIDERATIONS: { label: string; value: string }[] = [
  { label: t.aiContext.goals, value: '레이스 종류와 남은 기간' },
  { label: t.aiContext.workouts, value: '최근 30일 기록' },
  { label: t.aiContext.trend, value: '주차별 훈련량 변화' },
  { label: t.aiContext.acwr, value: '증량 속도가 안전한지' },
  { label: t.aiContext.profile, value: '피트니스 레벨 · 주간 가능 시간' },
];

export const INJURY_CONSIDERATIONS: { label: string; value: string }[] = [
  { label: t.aiContext.acwr, value: '급격한 증량 여부' },
  { label: t.aiContext.trend, value: '주차별 훈련량 변화' },
  { label: t.aiContext.condition, value: '컨디션 점수 추세' },
  { label: t.aiContext.workouts, value: '종목 편중 여부' },
  { label: t.aiContext.goals, value: '레이스까지 남은 기간 대비 부하' },
];
