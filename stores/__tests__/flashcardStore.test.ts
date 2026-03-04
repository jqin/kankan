import { initDatabase } from '../../db/database';
import { useFlashcardStore } from '../flashcardStore';

async function setup() {
  await initDatabase();
  useFlashcardStore.setState({ flashcards: [] });
}

describe('flashcardStore', () => {
  beforeEach(setup);

  describe('addFlashcard', () => {
    it('returns "added" and adds card to state', () => {
      const store = useFlashcardStore.getState();
      const result = store.addFlashcard('你好', 'nǐ hǎo', 'hello');
      expect(result).toBe('added');
      expect(useFlashcardStore.getState().flashcards).toHaveLength(1);
    });

    it('new card has correct field values', () => {
      useFlashcardStore.getState().addFlashcard('中文', 'zhōng wén', 'Chinese language');
      const card = useFlashcardStore.getState().flashcards[0];
      expect(card.chinese).toBe('中文');
      expect(card.pinyin).toBe('zhōng wén');
      expect(card.definition).toBe('Chinese language');
    });

    it('new card starts with default SRS values', () => {
      useFlashcardStore.getState().addFlashcard('你', 'nǐ', 'you');
      const card = useFlashcardStore.getState().flashcards[0];
      expect(card.easeFactor).toBeCloseTo(2.5);
      expect(card.interval).toBe(0);
      expect(card.repetitions).toBe(0);
    });

    it('returns "duplicate" for the same Chinese word', () => {
      const store = useFlashcardStore.getState();
      store.addFlashcard('你好', 'nǐ hǎo', 'hello');
      const result = store.addFlashcard('你好', 'nǐ hǎo', 'hello again');
      expect(result).toBe('duplicate');
    });

    it('duplicate does not add a second card', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      expect(useFlashcardStore.getState().flashcards).toHaveLength(1);
    });

    it('can add multiple distinct words', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      useFlashcardStore.getState().addFlashcard('中文', 'zhōng wén', 'Chinese');
      expect(useFlashcardStore.getState().flashcards).toHaveLength(2);
    });

    it('assigns a unique id to each card', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      useFlashcardStore.getState().addFlashcard('中文', 'zhōng wén', 'Chinese');
      const [a, b] = useFlashcardStore.getState().flashcards;
      expect(a.id).toBeTruthy();
      expect(b.id).toBeTruthy();
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('loadFlashcards', () => {
    it('loads cards from the database', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      // Reset state and reload
      useFlashcardStore.setState({ flashcards: [] });
      useFlashcardStore.getState().loadFlashcards();
      expect(useFlashcardStore.getState().flashcards).toHaveLength(1);
      expect(useFlashcardStore.getState().flashcards[0].chinese).toBe('你好');
    });

    it('returns empty array when no cards exist', () => {
      useFlashcardStore.getState().loadFlashcards();
      expect(useFlashcardStore.getState().flashcards).toHaveLength(0);
    });
  });

  describe('reviewCard', () => {
    it('updates SRS fields after a passing review', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      const { id } = useFlashcardStore.getState().flashcards[0];

      useFlashcardStore.getState().reviewCard(id, 4);

      const updated = useFlashcardStore.getState().flashcards[0];
      expect(updated.repetitions).toBe(1);
      expect(updated.interval).toBe(1);
      expect(updated.easeFactor).toBeCloseTo(2.5); // quality=4 leaves it unchanged
    });

    it('advances interval on subsequent passing reviews', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      const { id } = useFlashcardStore.getState().flashcards[0];

      useFlashcardStore.getState().reviewCard(id, 4); // rep=1, interval=1
      useFlashcardStore.getState().reviewCard(id, 4); // rep=2, interval=6
      useFlashcardStore.getState().reviewCard(id, 4); // rep=3, interval=15

      const card = useFlashcardStore.getState().flashcards[0];
      expect(card.repetitions).toBe(3);
      expect(card.interval).toBe(15);
    });

    it('resets repetitions on a failing review', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      const { id } = useFlashcardStore.getState().flashcards[0];
      useFlashcardStore.getState().reviewCard(id, 4);
      useFlashcardStore.getState().reviewCard(id, 4);

      useFlashcardStore.getState().reviewCard(id, 1); // fail

      const card = useFlashcardStore.getState().flashcards[0];
      expect(card.repetitions).toBe(0);
      expect(card.interval).toBe(1);
    });

    it('updates nextReview to a future timestamp', () => {
      const nowSecs = Math.floor(Date.now() / 1000);
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      const { id } = useFlashcardStore.getState().flashcards[0];

      useFlashcardStore.getState().reviewCard(id, 4);

      const card = useFlashcardStore.getState().flashcards[0];
      expect(card.nextReview).toBeGreaterThan(nowSecs);
    });

    it('does nothing for an unknown id', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      // Should not throw
      expect(() => useFlashcardStore.getState().reviewCard('nonexistent', 4)).not.toThrow();
      expect(useFlashcardStore.getState().flashcards).toHaveLength(1);
    });
  });

  describe('deleteFlashcard', () => {
    it('removes the card from state', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      const { id } = useFlashcardStore.getState().flashcards[0];

      useFlashcardStore.getState().deleteFlashcard(id);

      expect(useFlashcardStore.getState().flashcards).toHaveLength(0);
    });

    it('removes only the specified card', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      useFlashcardStore.getState().addFlashcard('中文', 'zhōng wén', 'Chinese');
      const cards = useFlashcardStore.getState().flashcards;
      const toDelete = cards.find((c) => c.chinese === '你好')!;

      useFlashcardStore.getState().deleteFlashcard(toDelete.id);

      const remaining = useFlashcardStore.getState().flashcards;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].chinese).toBe('中文');
    });

    it('persists deletion — card is gone after reload', () => {
      useFlashcardStore.getState().addFlashcard('你好', 'nǐ hǎo', 'hello');
      const { id } = useFlashcardStore.getState().flashcards[0];
      useFlashcardStore.getState().deleteFlashcard(id);

      useFlashcardStore.setState({ flashcards: [] });
      useFlashcardStore.getState().loadFlashcards();

      expect(useFlashcardStore.getState().flashcards).toHaveLength(0);
    });
  });
});
