import { t } from '../i18n/ko';

/**
 * 화면에서 고르는 선택지 목록.
 *
 * 글자는 전부 `src/i18n/ko.ts` 에서 가져온다 — 문구를 고칠 때 한 파일만 보면 되도록.
 * 여기 남는 건 값(DB에 저장되는 코드)과 숫자뿐이다.
 *
 * 레이스 종류는 여기 없다. 마라톤까지 포함한 9종이 `src/utils/races.ts` 에 있다.
 */

export const HR_ZONES = [
  { zone: 1, label: t.hrZone[1], min: 0.5, max: 0.6, color: '#3498DB' },
  { zone: 2, label: t.hrZone[2], min: 0.6, max: 0.7, color: '#2ECC71' },
  { zone: 3, label: t.hrZone[3], min: 0.7, max: 0.8, color: '#F39C12' },
  { zone: 4, label: t.hrZone[4], min: 0.8, max: 0.9, color: '#E67E22' },
  { zone: 5, label: t.hrZone[5], min: 0.9, max: 1.0, color: '#E74C3C' },
] as const;

export const SURFACES = [
  { value: 'road', label: t.surface.road },
  { value: 'trail', label: t.surface.trail },
  { value: 'track', label: t.surface.track },
  { value: 'treadmill', label: t.surface.treadmill },
] as const;

export const STROKE_TYPES = [
  { value: 'freestyle', label: t.stroke.freestyle },
  { value: 'backstroke', label: t.stroke.backstroke },
  { value: 'breaststroke', label: t.stroke.breaststroke },
  { value: 'butterfly', label: t.stroke.butterfly },
  { value: 'mixed', label: t.stroke.mixed },
] as const;

export const BIKE_TYPES = [
  { value: 'road', label: t.bike.road },
  { value: 'tt', label: t.bike.tt },
  { value: 'mountain', label: t.bike.mountain },
  { value: 'trainer', label: t.bike.trainer },
] as const;

export const FITNESS_LEVELS = [
  { value: 'beginner', label: t.fitnessLevel.beginner, description: t.fitnessLevelDesc.beginner },
  { value: 'intermediate', label: t.fitnessLevel.intermediate, description: t.fitnessLevelDesc.intermediate },
  { value: 'advanced', label: t.fitnessLevel.advanced, description: t.fitnessLevelDesc.advanced },
  { value: 'elite', label: t.fitnessLevel.elite, description: t.fitnessLevelDesc.elite },
] as const;

/** 저장된 코드값을 화면 문구로. 없는 값이면 코드값을 그대로 보여준다. */
export function surfaceLabel(value: string): string {
  return (t.surface as Record<string, string>)[value] ?? value;
}

export function strokeLabel(value: string): string {
  return (t.stroke as Record<string, string>)[value] ?? value;
}

export function bikeTypeLabel(value: string): string {
  return (t.bike as Record<string, string>)[value] ?? value;
}
