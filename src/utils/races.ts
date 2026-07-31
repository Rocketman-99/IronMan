import { type RaceType } from '../types';
import { t } from '../i18n/ko';

/**
 * 목표로 고를 수 있는 레이스 목록. 목표 탭과 온보딩이 같은 목록을 쓴다.
 * 문구는 `src/i18n/ko.ts` 에서 온다.
 */
export const RACE_OPTIONS: {
  category: string;
  items: { value: RaceType; label: string; detail: string }[];
}[] = [
  {
    category: t.raceCategory.triathlon,
    items: (['sprint', 'olympic', 'half_ironman', 'full_ironman'] as const).map((v) => ({
      value: v,
      label: t.raceTypeShort[v],
      detail: t.raceTypeDetail[v],
    })),
  },
  {
    category: t.raceCategory.marathon,
    items: (['marathon_5k', 'marathon_10k', 'half_marathon', 'full_marathon', 'ultra'] as const).map(
      (v) => ({ value: v, label: t.raceTypeShort[v], detail: t.raceTypeDetail[v] })
    ),
  },
];

/** 레이스 목표의 기본 제목. 사용자가 제목을 비워두면 이걸 쓴다. */
export function defaultRaceTitle(race: RaceType): string {
  return `${t.raceTypeShort[race]} 완주`;
}

/**
 * 레이스 당일까지 남은 일수.
 * 오늘이면 0, 지났으면 음수. KST 기준 날짜 문자열(YYYY-MM-DD)을 받는다.
 */
export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00+09:00').getTime();
  if (Number.isNaN(target)) return null;
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const today = new Date(
    `${nowKST.toISOString().slice(0, 10)}T00:00:00+09:00`
  ).getTime();
  return Math.round((target - today) / 86400000);
}

/** D-12 / 오늘! / 종료 */
export function formatDday(dateStr: string | null): string | null {
  const d = daysUntil(dateStr);
  if (d === null) return null;
  if (d === 0) return t.goals.ddayToday;
  if (d < 0) return t.goals.ddayPast;
  return t.goals.dday.replace('{n}', String(d));
}
