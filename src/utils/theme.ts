/**
 * 색상만 담는다. 화면에 보이는 한글 문구와 라벨은 `src/i18n/ko.ts` 에 있다.
 */

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

export const feelingEmojis = {
  1: '😫',
  2: '😔',
  3: '😐',
  4: '😊',
  5: '🔥',
} as const;
