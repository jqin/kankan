import { getDb, DictEntry } from '../db/database';

export type { DictEntry };

export function lookupWord(simplified: string): DictEntry | null {
  const db = getDb();
  const result = db.getFirstSync<DictEntry>(
    'SELECT simplified, traditional, pinyin, definition FROM dictionary WHERE simplified = ? LIMIT 1',
    [simplified]
  );
  return result ?? null;
}

export function getAllSimplified(): string[] {
  const db = getDb();
  const rows = db.getAllSync<{ simplified: string }>(
    'SELECT simplified FROM dictionary'
  );
  return rows.map((r) => r.simplified);
}
