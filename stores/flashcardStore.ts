import { create } from 'zustand';
import { getDb } from '../db/database';
import { sm2 } from '../lib/srs';

export interface Flashcard {
  id: string;
  chinese: string;
  pinyin: string;
  definition: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  createdAt: number;
}

interface FlashcardStore {
  flashcards: Flashcard[];
  loadFlashcards: () => void;
  addFlashcard: (chinese: string, pinyin: string, definition: string) => 'added' | 'duplicate';
  reviewCard: (id: string, quality: number) => void;
  deleteFlashcard: (id: string) => void;
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadRows(db: ReturnType<typeof getDb>): Flashcard[] {
  return db
    .getAllSync<{
      id: string;
      chinese: string;
      pinyin: string;
      definition: string;
      ease_factor: number;
      interval: number;
      repetitions: number;
      next_review: number;
      created_at: number;
    }>('SELECT * FROM flashcards ORDER BY created_at DESC')
    .map((r) => ({
      id: r.id,
      chinese: r.chinese,
      pinyin: r.pinyin,
      definition: r.definition,
      easeFactor: r.ease_factor,
      interval: r.interval,
      repetitions: r.repetitions,
      nextReview: r.next_review,
      createdAt: r.created_at,
    }));
}

export const useFlashcardStore = create<FlashcardStore>((set) => ({
  flashcards: [],

  loadFlashcards: () => {
    const db = getDb();
    set({ flashcards: loadRows(db) });
  },

  addFlashcard: (chinese, pinyin, definition) => {
    const db = getDb();
    const existing = db.getFirstSync<{ id: string }>(
      'SELECT id FROM flashcards WHERE chinese = ?',
      [chinese]
    );
    if (existing) return 'duplicate';

    const id = makeId();
    db.runSync(
      'INSERT INTO flashcards (id, chinese, pinyin, definition) VALUES (?, ?, ?, ?)',
      [id, chinese, pinyin, definition]
    );
    set({ flashcards: loadRows(db) });
    return 'added';
  },

  reviewCard: (id, quality) => {
    const db = getDb();
    const row = db.getFirstSync<{
      ease_factor: number;
      interval: number;
      repetitions: number;
    }>('SELECT ease_factor, interval, repetitions FROM flashcards WHERE id = ?', [id]);
    if (!row) return;

    const result = sm2(quality, {
      easeFactor: row.ease_factor,
      interval: row.interval,
      repetitions: row.repetitions,
    });

    db.runSync(
      'UPDATE flashcards SET ease_factor = ?, interval = ?, repetitions = ?, next_review = ? WHERE id = ?',
      [result.easeFactor, result.interval, result.repetitions, result.nextReviewAt, id]
    );
    set({ flashcards: loadRows(db) });
  },

  deleteFlashcard: (id) => {
    const db = getDb();
    db.runSync('DELETE FROM flashcards WHERE id = ?', [id]);
    set((state) => ({ flashcards: state.flashcards.filter((c) => c.id !== id) }));
  },
}));
