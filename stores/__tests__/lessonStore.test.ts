import { initDatabase } from '../../db/database';
import { useLessonStore } from '../lessonStore';

async function setup() {
  await initDatabase();
  useLessonStore.setState({ lessons: [] });
}

describe('lessonStore', () => {
  beforeEach(setup);

  describe('createLesson', () => {
    it('returns a non-empty id', async () => {
      const id = await useLessonStore.getState().createLesson('你好世界');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('adds the lesson to state', async () => {
      await useLessonStore.getState().createLesson('你好世界');
      expect(useLessonStore.getState().lessons).toHaveLength(1);
    });

    it('stores the original text', async () => {
      await useLessonStore.getState().createLesson('你好世界');
      expect(useLessonStore.getState().lessons[0].originalText).toBe('你好世界');
    });

    it('sets title to first 20 chars of text', async () => {
      const longText = '这是一段非常非常非常非常非常非常非常长的文本';
      await useLessonStore.getState().createLesson(longText);
      expect(useLessonStore.getState().lessons[0].title).toBe(longText.slice(0, 20));
    });

    it('uses "Untitled" for empty text', async () => {
      await useLessonStore.getState().createLesson('');
      expect(useLessonStore.getState().lessons[0].title).toBe('Untitled');
    });

    it('uses "Untitled" for whitespace-only text', async () => {
      await useLessonStore.getState().createLesson('   ');
      expect(useLessonStore.getState().lessons[0].title).toBe('Untitled');
    });

    it('assigns unique ids to separate lessons', async () => {
      const id1 = await useLessonStore.getState().createLesson('你好');
      const id2 = await useLessonStore.getState().createLesson('中文');
      expect(id1).not.toBe(id2);
    });

    it('adds multiple lessons', async () => {
      await useLessonStore.getState().createLesson('你好');
      await useLessonStore.getState().createLesson('中文');
      expect(useLessonStore.getState().lessons).toHaveLength(2);
    });
  });

  describe('loadLessons', () => {
    it('loads persisted lessons from the database', async () => {
      await useLessonStore.getState().createLesson('你好');
      useLessonStore.setState({ lessons: [] }); // clear in-memory state

      await useLessonStore.getState().loadLessons();

      expect(useLessonStore.getState().lessons).toHaveLength(1);
      expect(useLessonStore.getState().lessons[0].originalText).toBe('你好');
    });

    it('returns empty array when no lessons exist', async () => {
      await useLessonStore.getState().loadLessons();
      expect(useLessonStore.getState().lessons).toHaveLength(0);
    });

    it('includes all created lessons', async () => {
      await useLessonStore.getState().createLesson('first');
      await useLessonStore.getState().createLesson('second');
      const texts = useLessonStore.getState().lessons.map((l) => l.originalText);
      expect(texts).toContain('first');
      expect(texts).toContain('second');
    });
  });

  describe('deleteLesson', () => {
    it('removes the lesson from state', async () => {
      await useLessonStore.getState().createLesson('你好');
      const { id } = useLessonStore.getState().lessons[0];

      await useLessonStore.getState().deleteLesson(id);

      expect(useLessonStore.getState().lessons).toHaveLength(0);
    });

    it('removes only the specified lesson', async () => {
      await useLessonStore.getState().createLesson('你好');
      await useLessonStore.getState().createLesson('中文');
      const toDelete = useLessonStore.getState().lessons.find((l) => l.originalText === '你好')!;

      await useLessonStore.getState().deleteLesson(toDelete.id);

      const remaining = useLessonStore.getState().lessons;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].originalText).toBe('中文');
    });

    it('persists deletion — lesson is gone after reload', async () => {
      await useLessonStore.getState().createLesson('你好');
      const { id } = useLessonStore.getState().lessons[0];
      await useLessonStore.getState().deleteLesson(id);

      useLessonStore.setState({ lessons: [] });
      await useLessonStore.getState().loadLessons();

      expect(useLessonStore.getState().lessons).toHaveLength(0);
    });
  });
});
