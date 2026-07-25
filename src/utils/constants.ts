export const HR_ZONES = [
  { zone: 1, label: '회복', min: 0.5, max: 0.6, color: '#3498DB' },
  { zone: 2, label: '기초 유산소', min: 0.6, max: 0.7, color: '#2ECC71' },
  { zone: 3, label: '유산소', min: 0.7, max: 0.8, color: '#F39C12' },
  { zone: 4, label: '젠산 역치', min: 0.8, max: 0.9, color: '#E67E22' },
  { zone: 5, label: '최대 강도', min: 0.9, max: 1.0, color: '#E74C3C' },
] as const;

export const SURFACES = [
  { value: 'road', label: '도로' },
  { value: 'trail', label: '트레일' },
  { value: 'track', label: '트랙' },
  { value: 'treadmill', label: '트레드밀' },
] as const;

export const STROKE_TYPES = [
  { value: 'freestyle', label: '자유형' },
  { value: 'backstroke', label: '배영' },
  { value: 'breaststroke', label: '평영' },
  { value: 'butterfly', label: '접영' },
  { value: 'mixed', label: '혼합' },
] as const;

export const BIKE_TYPES = [
  { value: 'road', label: '로드' },
  { value: 'tt', label: '타임트라이얼' },
  { value: 'mountain', label: '산악' },
  { value: 'trainer', label: '실내 트레이너' },
] as const;

export const FITNESS_LEVELS = [
  {
    value: 'beginner',
    label: '입문',
    description: '트라이애슬론을 처음 시작하거나 규칙적 운동을 시작한 단계',
  },
  {
    value: 'intermediate',
    label: '중급',
    description: '6개월 이상 규칙적으로 훈련, 완주 경험 있음',
  },
  {
    value: 'advanced',
    label: '고급',
    description: '2년 이상 체계적 훈련, 다수 대회 완주',
  },
  {
    value: 'elite',
    label: '엘리트',
    description: '고성능 목표, 입상 경험',
  },
] as const;

export const RACE_TYPES = [
  { value: 'sprint', label: '스프린트', detail: '수영 750m / 사이클 20km / 러닝 5km' },
  { value: 'olympic', label: '올림픽', detail: '수영 1.5km / 사이클 40km / 러닝 10km' },
  { value: 'half_ironman', label: '하프 아이언맨', detail: '수영 1.9km / 사이클 90km / 러닝 21km' },
  { value: 'full_ironman', label: '풀 아이언맨', detail: '수영 3.8km / 사이클 180km / 러닝 42km' },
] as const;

export const AI_COST = {
  haiku: 0.5,
  sonnet: 2,
  dailyLimit: 15,
} as const;
