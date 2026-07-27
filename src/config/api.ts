/**
 * 용도별 모델과 일일 사용량 예산.
 *
 * `fast` 는 매번 돌아가는 짧은 작업(운동 저장 직후 분석, 오늘의 팁, 채팅)에,
 * `deep` 은 오래 생각해야 하는 작업(부상 위험 평가, 훈련 계획 생성)에 쓴다.
 */
export const AI_MODELS = {
  fast: 'claude-sonnet-5',
  deep: 'claude-opus-5',
} as const;

/** 화면에 표시하는 모델 이름 (설정 > AI 모델 정보) */
export const AI_MODEL_NAMES = {
  fast: 'Claude Sonnet 5',
  deep: 'Claude Opus 5',
} as const;

export const AI_LIMITS = {
  fastCost: 1,
  deepCost: 3,
  dailyBudget: 15,
} as const;
