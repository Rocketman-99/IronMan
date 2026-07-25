export const colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  card: '#222222',
  cardBorder: '#333333',
  primary: '#C0392B',
  primaryLight: '#E74C3C',
  gold: '#F39C12',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  running: '#E74C3C',
  swimming: '#2980B9',
  cycling: '#27AE60',
  divider: '#2A2A2A',
} as const;

export const sportColors = {
  running: colors.running,
  swimming: colors.swimming,
  cycling: colors.cycling,
} as const;

export const sportLabels = {
  running: '러닝',
  swimming: '수영',
  cycling: '사이클',
} as const;

export const fitnessLevelLabels = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
  elite: '엘리트',
} as const;

export const raceTypeLabels = {
  sprint: '스프린트 (750m/20km/5km)',
  olympic: '올림픽 (1.5km/40km/10km)',
  half_ironman: '하프 아이언맨 (1.9km/90km/21km)',
  full_ironman: '풀 아이언맨 (3.8km/180km/42km)',
} as const;

export const feelingLabels = {
  1: '매우 힘듦',
  2: '힘듦',
  3: '보통',
  4: '좋음',
  5: '최고',
} as const;

export const feelingEmojis = {
  1: '😫',
  2: '😔',
  3: '😐',
  4: '😊',
  5: '🔥',
} as const;
