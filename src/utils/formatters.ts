export function getKSTDate(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

export function getTodayKST(): string {
  return getKSTDate().toISOString().slice(0, 10);
}

export function getNowKST(): string {
  return getKSTDate().toISOString().replace('Z', '+09:00');
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = secPerKm % 60;
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

export function formatSwimPace(secPer100m: number): string {
  const m = Math.floor(secPer100m / 60);
  const s = secPer100m % 60;
  return `${m}:${String(s).padStart(2, '0')} /100m`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatDistanceKm(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatSwimDistance(meters: number): string {
  return `${Math.round(meters)} m`;
}

export function formatWorkoutDate(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateStr + 'T00:00:00+09:00');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00+09:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function calcPaceSecPerKm(distanceM: number, durationSec: number): number {
  if (distanceM <= 0) return 0;
  const km = distanceM / 1000;
  return Math.round(durationSec / km);
}

export function calcSpeedKmh(distanceM: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  const km = distanceM / 1000;
  const hours = durationSec / 3600;
  return Math.round((km / hours) * 10) / 10;
}

export function estimateCalories(
  sport: 'running' | 'swimming' | 'cycling',
  durationSec: number,
  weightKg: number
): number {
  const hours = durationSec / 3600;
  const metValues = { running: 9.8, swimming: 7.0, cycling: 8.0 };
  return Math.round(metValues[sport] * weightKg * hours);
}

export function calcAge(birthDate: string): number {
  const today = getKSTDate();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function estimateMaxHR(birthDate: string): number {
  return 220 - calcAge(birthDate);
}

export function getWeekStartKST(dateStr?: string): string {
  const date = dateStr
    ? new Date(dateStr + 'T00:00:00+09:00')
    : getKSTDate();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}
