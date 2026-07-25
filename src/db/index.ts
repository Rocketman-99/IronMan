import { type SQLiteDatabase } from 'expo-sqlite';
import { ALL_TABLES } from './schema';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  for (const sql of ALL_TABLES) {
    await db.execAsync(sql);
  }
}
