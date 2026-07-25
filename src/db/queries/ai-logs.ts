import { type SQLiteDatabase } from 'expo-sqlite';
import { type Message, type AIConvType } from '../../types';
import { getNowKST } from '../../utils/formatters';

export async function saveConversation(
  db: SQLiteDatabase,
  convType: AIConvType,
  messages: Message[],
  opts?: { workoutId?: number; contextJson?: string; modelUsed?: string }
): Promise<number> {
  const now = getNowKST();
  const result = await db.runAsync(
    `INSERT INTO ai_conversations (conv_type, workout_id, messages, context_json, model_used, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    convType,
    opts?.workoutId ?? null,
    JSON.stringify(messages),
    opts?.contextJson ?? null,
    opts?.modelUsed ?? null,
    now
  );
  return result.lastInsertRowId;
}

export async function getAppSetting(
  db: SQLiteDatabase,
  key: string
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function setAppSetting(
  db: SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
    key,
    value
  );
}
