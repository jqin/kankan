import { create } from 'zustand';
import { getDb } from '../db/database';

export interface Lesson {
  id: string;
  title: string;
  originalText: string;
  createdAt: number;
}

interface LessonStore {
  lessons: Lesson[];
  loadLessons: () => Promise<void>;
  createLesson: (text: string) => Promise<string>;
  deleteLesson: (id: string) => Promise<void>;
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function makeTitle(text: string): string {
  return text.trim().slice(0, 20) || 'Untitled';
}

export const useLessonStore = create<LessonStore>((set) => ({
  lessons: [],

  loadLessons: async () => {
    const db = getDb();
    const rows = db.getAllSync<{
      id: string;
      title: string;
      original_text: string;
      created_at: number;
    }>('SELECT id, title, original_text, created_at FROM lessons ORDER BY created_at DESC');

    set({
      lessons: rows.map((r) => ({
        id: r.id,
        title: r.title,
        originalText: r.original_text,
        createdAt: r.created_at,
      })),
    });
  },

  createLesson: async (text: string) => {
    const db = getDb();
    const id = makeId();
    const title = makeTitle(text);
    await db.runAsync(
      'INSERT INTO lessons (id, title, original_text) VALUES (?, ?, ?)',
      [id, title, text]
    );
    // Reload lessons
    const rows = db.getAllSync<{
      id: string;
      title: string;
      original_text: string;
      created_at: number;
    }>('SELECT id, title, original_text, created_at FROM lessons ORDER BY created_at DESC');

    set({
      lessons: rows.map((r) => ({
        id: r.id,
        title: r.title,
        originalText: r.original_text,
        createdAt: r.created_at,
      })),
    });

    return id;
  },

  deleteLesson: async (id: string) => {
    const db = getDb();
    await db.runAsync('DELETE FROM lessons WHERE id = ?', [id]);
    set((state) => ({
      lessons: state.lessons.filter((l) => l.id !== id),
    }));
  },
}));
