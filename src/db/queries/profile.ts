import { type SQLiteDatabase } from 'expo-sqlite';
import { type UserProfile, type ProfileDraft } from '../../types';
import { getNowKST } from '../../utils/formatters';

export async function getProfile(db: SQLiteDatabase): Promise<UserProfile | null> {
  const result = await db.getFirstAsync<UserProfile>(
    'SELECT * FROM user_profile WHERE id = 1'
  );
  return result ?? null;
}

export async function upsertProfile(
  db: SQLiteDatabase,
  data: Partial<ProfileDraft> & { onboarding_done?: number }
): Promise<void> {
  const existing = await getProfile(db);
  const now = getNowKST();

  if (existing) {
    const fields = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = [...Object.values(data), now, 1];
    await db.runAsync(
      `UPDATE user_profile SET ${fields}, updated_at = ? WHERE id = ?`,
      ...values
    );
  } else {
    const name = (data as ProfileDraft).name ?? '';
    const fitnessLevel = (data as ProfileDraft).fitness_level ?? 'beginner';
    await db.runAsync(
      `INSERT INTO user_profile (id, name, fitness_level, weekly_hours, onboarding_done, created_at, updated_at)
       VALUES (1, ?, ?, ?, 0, ?, ?)`,
      name,
      fitnessLevel,
      (data as ProfileDraft).weekly_hours ?? 5,
      now,
      now
    );
    if (Object.keys(data).length > 1) {
      await upsertProfile(db, data);
    }
  }
}

export async function markOnboardingDone(db: SQLiteDatabase): Promise<void> {
  const now = getNowKST();
  await db.runAsync(
    'UPDATE user_profile SET onboarding_done = 1, updated_at = ? WHERE id = 1',
    now
  );
}
