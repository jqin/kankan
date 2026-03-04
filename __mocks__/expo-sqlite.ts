/**
 * expo-sqlite mock backed by better-sqlite3 (in-memory).
 * Each call to openDatabaseAsync creates a fresh in-memory DB.
 * Used via moduleNameMapper in jest config.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BetterSQLite = require('better-sqlite3');

type BetterDB = ReturnType<typeof BetterSQLite>;

function makeInterface(db: BetterDB) {
  return {
    execAsync: async (sql: string) => {
      db.exec(sql);
    },
    runAsync: async (sql: string, params: unknown[] = []) => {
      db.prepare(sql).run(...params);
    },
    getFirstAsync: async <T>(sql: string, params: unknown[] = []): Promise<T | null> => {
      return (db.prepare(sql).get(...params) as T) ?? null;
    },
    getAllSync: <T>(sql: string, params: unknown[] = []): T[] => {
      return db.prepare(sql).all(...params) as T[];
    },
    getFirstSync: <T>(sql: string, params: unknown[] = []): T | null => {
      return (db.prepare(sql).get(...params) as T) ?? null;
    },
    runSync: (sql: string, params: unknown[] = []) => {
      db.prepare(sql).run(...params);
    },
  };
}

export async function openDatabaseAsync(_name: string) {
  const db = new BetterSQLite(':memory:') as BetterDB;
  return makeInterface(db);
}
