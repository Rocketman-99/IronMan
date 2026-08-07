import { type SQLiteDatabase } from 'expo-sqlite';
import { type Message, type AIConvType } from '../../types';
import { getNowKST } from '../../utils/formatters';

/**
 * AI 결과를 기기에 남기는 곳.
 *
 * 예전에는 이 파일 전체가 쓰이지 않아, 부상 평가·오늘의 팁·코치 대화·AI 사용량이
 * 전부 메모리에만 있었다. 앱을 다시 켜면 사라지고, "하루 한 번" 팁 규칙과 일일
 * 한도도 같이 초기화됐다.
 */

/** app_settings 키. 문자열을 흩뿌리지 않도록 한곳에 모은다. */
export const SETTING_KEYS = {
  injuryAssessment: 'injury_assessment',
  dailyTip: 'daily_tip',
  aiUsage: 'ai_usage',
} as const;

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

/** 최신 대화 한 건. 코치 화면에 들어올 때 이어서 보여준다. */
export async function getLatestConversation(
  db: SQLiteDatabase,
  convType: AIConvType
): Promise<Message[]> {
  const row = await db.getFirstAsync<{ messages: string }>(
    'SELECT messages FROM ai_conversations WHERE conv_type = ? ORDER BY id DESC LIMIT 1',
    convType
  );
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.messages);
    return Array.isArray(parsed) ? (parsed as Message[]) : [];
  } catch {
    // 깨진 기록 때문에 화면이 죽지 않도록 빈 대화로 시작한다.
    return [];
  }
}

export async function deleteConversations(
  db: SQLiteDatabase,
  convType: AIConvType
): Promise<void> {
  await db.runAsync('DELETE FROM ai_conversations WHERE conv_type = ?', convType);
}

/** JSON 값 저장/조회. 깨진 값은 없는 것으로 친다. */
export async function getJsonSetting<T>(db: SQLiteDatabase, key: string): Promise<T | null> {
  const raw = await getAppSetting(db, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJsonSetting(
  db: SQLiteDatabase,
  key: string,
  value: unknown
): Promise<void> {
  await setAppSetting(db, key, JSON.stringify(value));
}
