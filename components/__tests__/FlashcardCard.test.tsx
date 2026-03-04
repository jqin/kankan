import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FlashcardCard from '../FlashcardCard';
import { Flashcard } from '../../stores/flashcardStore';

const CARD: Flashcard = {
  id: 'test-1',
  chinese: '你好',
  pinyin: 'nǐ hǎo',
  definition: 'Hello; Hi',
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReview: Math.floor(Date.now() / 1000),
  createdAt: Math.floor(Date.now() / 1000),
};

describe('FlashcardCard', () => {
  describe('initial state (front face)', () => {
    it('shows the Chinese characters', () => {
      // Both front and back render the character (back is visually hidden via animated style,
      // but present in the tree since our reanimated mock returns {} for all styles).
      const { getAllByText } = render(<FlashcardCard card={CARD} onRate={jest.fn()} />);
      expect(getAllByText('你好').length).toBeGreaterThan(0);
    });

    it('shows the pinyin', () => {
      const { getAllByText } = render(<FlashcardCard card={CARD} onRate={jest.fn()} />);
      expect(getAllByText('nǐ hǎo').length).toBeGreaterThan(0);
    });

    it('shows "Tap to reveal" hint', () => {
      const { getByText } = render(<FlashcardCard card={CARD} onRate={jest.fn()} />);
      expect(getByText('Tap to reveal')).toBeTruthy();
    });

    it('does not show rating buttons before flip', () => {
      const { queryByText } = render(<FlashcardCard card={CARD} onRate={jest.fn()} />);
      expect(queryByText('Again')).toBeNull();
      expect(queryByText('Hard')).toBeNull();
      expect(queryByText('Good')).toBeNull();
      expect(queryByText('Easy')).toBeNull();
    });
  });

  describe('after tapping to flip', () => {
    it('shows rating buttons after flip', () => {
      const { getByText } = render(<FlashcardCard card={CARD} onRate={jest.fn()} />);
      fireEvent.press(getByText('Tap to reveal'));
      expect(getByText('Again')).toBeTruthy();
      expect(getByText('Hard')).toBeTruthy();
      expect(getByText('Good')).toBeTruthy();
      expect(getByText('Easy')).toBeTruthy();
    });

    it('shows the definition after flip', () => {
      const { getByText } = render(<FlashcardCard card={CARD} onRate={jest.fn()} />);
      fireEvent.press(getByText('Tap to reveal'));
      expect(getByText('Hello; Hi')).toBeTruthy();
    });
  });

  describe('rating buttons', () => {
    function renderFlipped(onRate = jest.fn()) {
      const utils = render(<FlashcardCard card={CARD} onRate={onRate} />);
      fireEvent.press(utils.getByText('Tap to reveal'));
      return { ...utils, onRate };
    }

    it('Again button calls onRate with quality 1', () => {
      const { getByText, onRate } = renderFlipped();
      fireEvent.press(getByText('Again'));
      expect(onRate).toHaveBeenCalledWith(1);
    });

    it('Hard button calls onRate with quality 2', () => {
      const { getByText, onRate } = renderFlipped();
      fireEvent.press(getByText('Hard'));
      expect(onRate).toHaveBeenCalledWith(2);
    });

    it('Good button calls onRate with quality 4', () => {
      const { getByText, onRate } = renderFlipped();
      fireEvent.press(getByText('Good'));
      expect(onRate).toHaveBeenCalledWith(4);
    });

    it('Easy button calls onRate with quality 5', () => {
      const { getByText, onRate } = renderFlipped();
      fireEvent.press(getByText('Easy'));
      expect(onRate).toHaveBeenCalledWith(5);
    });

    it('onRate is called exactly once per tap', () => {
      const { getByText, onRate } = renderFlipped();
      fireEvent.press(getByText('Good'));
      expect(onRate).toHaveBeenCalledTimes(1);
    });
  });

  describe('re-rendering with different cards', () => {
    it('shows the correct Chinese for a different card', () => {
      const card2: Flashcard = { ...CARD, id: 'test-2', chinese: '中文', pinyin: 'zhōng wén', definition: 'Chinese' };
      const { getAllByText } = render(<FlashcardCard card={card2} onRate={jest.fn()} />);
      expect(getAllByText('中文').length).toBeGreaterThan(0);
    });
  });
});
