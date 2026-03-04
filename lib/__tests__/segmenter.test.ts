import { segmentText, resetSegmenterCache } from '../segmenter';

// Dictionary fixture: 你好 (hello), 中文 (Chinese), 你 (you), 好 (good)
const DICT: Record<string, { simplified: string; traditional: string; pinyin: string; definition: string }> = {
  你好: { simplified: '你好', traditional: '你好', pinyin: 'nǐ hǎo', definition: 'hello' },
  中文: { simplified: '中文', traditional: '中文', pinyin: 'zhōng wén', definition: 'Chinese language' },
  你:   { simplified: '你', traditional: '你', pinyin: 'nǐ', definition: 'you' },
  好:   { simplified: '好', traditional: '好', pinyin: 'hǎo', definition: 'good; well' },
  我:   { simplified: '我', traditional: '我', pinyin: 'wǒ', definition: 'I; me' },
  是:   { simplified: '是', traditional: '是', pinyin: 'shì', definition: 'to be; yes' },
  学习: { simplified: '学习', traditional: '學習', pinyin: 'xué xí', definition: 'to study' },
};

jest.mock('../dictionary', () => ({
  getAllSimplified: () => Object.keys(DICT),
  lookupWord: (word: string) => DICT[word] ?? null,
}));

beforeEach(() => {
  resetSegmenterCache();
});

describe('segmentText', () => {
  describe('multi-character word matching', () => {
    it('matches a 2-char dictionary word as one segment', () => {
      const segs = segmentText('你好');
      expect(segs).toHaveLength(1);
      expect(segs[0]).toMatchObject({ word: '你好', pinyin: 'nǐ hǎo', isKnown: true });
    });

    it('greedy-matches the longest word first', () => {
      // 你好 (2 chars) should win over 你 (1 char) + 好 (1 char)
      const segs = segmentText('你好');
      expect(segs).toHaveLength(1);
      expect(segs[0].word).toBe('你好');
    });

    it('segments a sequence of known 2-char words', () => {
      const segs = segmentText('你好中文');
      expect(segs).toHaveLength(2);
      expect(segs[0].word).toBe('你好');
      expect(segs[1].word).toBe('中文');
    });

    it('matches multi-char words with correct pinyin and definition', () => {
      const segs = segmentText('中文');
      expect(segs[0].pinyin).toBe('zhōng wén');
      expect(segs[0].definition).toBe('Chinese language');
    });
  });

  describe('single character fallback', () => {
    it('falls back to single char for unknown Chinese characters', () => {
      // 啊 is not in our test dictionary
      const segs = segmentText('啊');
      expect(segs).toHaveLength(1);
      expect(segs[0]).toMatchObject({ word: '啊', isKnown: false, pinyin: '', definition: '' });
    });

    it('marks known single chars as isKnown=true', () => {
      // 你 is known but 你好 is consumed first; use 你 alone
      const segs = segmentText('你我');
      // 你 matches as single char (no 2+ char match starting with 你我), 我 matches single
      expect(segs[0]).toMatchObject({ word: '你', isKnown: true, pinyin: 'nǐ' });
      expect(segs[1]).toMatchObject({ word: '我', isKnown: true, pinyin: 'wǒ' });
    });

    it('unknown single Chinese chars have empty pinyin', () => {
      const segs = segmentText('啊');
      expect(segs[0].pinyin).toBe('');
      expect(segs[0].definition).toBe('');
    });
  });

  describe('non-Chinese characters', () => {
    it('passes through ASCII letters one by one as isKnown=false', () => {
      const segs = segmentText('hi');
      expect(segs).toHaveLength(2);
      expect(segs[0]).toMatchObject({ word: 'h', isKnown: false, pinyin: '' });
      expect(segs[1]).toMatchObject({ word: 'i', isKnown: false, pinyin: '' });
    });

    it('passes through spaces and punctuation', () => {
      const segs = segmentText(' ');
      expect(segs).toHaveLength(1);
      expect(segs[0]).toMatchObject({ word: ' ', isKnown: false });
    });

    it('passes through numbers', () => {
      const segs = segmentText('123');
      expect(segs).toHaveLength(3);
      expect(segs.map((s) => s.word)).toEqual(['1', '2', '3']);
    });
  });

  describe('mixed Chinese and non-Chinese text', () => {
    it('handles Chinese words mixed with ASCII', () => {
      const segs = segmentText('你好world');
      expect(segs[0]).toMatchObject({ word: '你好', isKnown: true });
      expect(segs.slice(1).map((s) => s.word)).toEqual(['w', 'o', 'r', 'l', 'd']);
    });

    it('handles punctuation between Chinese words', () => {
      const segs = segmentText('你好，中文');
      expect(segs[0].word).toBe('你好');
      expect(segs[1].word).toBe('，');
      expect(segs[2].word).toBe('中文');
    });
  });

  describe('empty input', () => {
    it('returns empty array for empty string', () => {
      expect(segmentText('')).toEqual([]);
    });
  });
});
