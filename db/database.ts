import * as SQLite from 'expo-sqlite';
import dictionaryData from '../assets/dictionary.json';

export interface DictEntry {
  simplified: string;
  traditional: string;
  pinyin: string;
  definition: string;
}

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Database not initialized');
  return _db;
}

export async function initDatabase(): Promise<void> {
  _db = await SQLite.openDatabaseAsync('kankan.db');

  await _db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title TEXT,
      original_text TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS dictionary (
      simplified TEXT NOT NULL,
      traditional TEXT NOT NULL,
      pinyin TEXT NOT NULL,
      definition TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_dict_simplified ON dictionary(simplified);

    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      chinese TEXT NOT NULL,
      pinyin TEXT NOT NULL,
      definition TEXT NOT NULL,
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      next_review INTEGER DEFAULT (unixepoch()),
      created_at INTEGER DEFAULT (unixepoch()),
      UNIQUE(chinese)
    );
    CREATE INDEX IF NOT EXISTS idx_fc_next_review ON flashcards(next_review);
  `);

  // Seed dictionary if empty
  const countResult = await _db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM dictionary'
  );
  if (countResult && countResult.count === 0) {
    await seedDictionary(_db);
  }
}

async function seedDictionary(db: SQLite.SQLiteDatabase): Promise<void> {
  const entries = dictionaryData as DictEntry[];

  // Insert in batches
  const batchSize = 100;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const placeholders = batch.map(() => '(?, ?, ?, ?)').join(', ');
    const values = batch.flatMap((e) => [
      e.simplified,
      e.traditional,
      e.pinyin,
      e.definition,
    ]);
    await db.runAsync(
      `INSERT INTO dictionary (simplified, traditional, pinyin, definition) VALUES ${placeholders}`,
      values
    );
  }
}
