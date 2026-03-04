import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TappableText from '../TappableText';
import { WordSegment } from '../../lib/segmenter';

// Isolate TappableText from its WordPopup dependency
jest.mock('../WordPopup', () => {
  const { View, Text } = require('react-native');
  return function MockWordPopup({ word, onClose }: { word: WordSegment; onClose: () => void }) {
    return (
      <View testID="word-popup">
        <Text testID="popup-word">{word.word}</Text>
        <Text testID="popup-close" onPress={onClose}>
          Close
        </Text>
      </View>
    );
  };
});

const knownWord = (word: string, pinyin: string): WordSegment => ({
  word,
  pinyin,
  definition: `def of ${word}`,
  isKnown: true,
});

const unknownChar = (char: string): WordSegment => ({
  word: char,
  pinyin: '',
  definition: '',
  isKnown: false,
});

describe('TappableText', () => {
  describe('rendering known words', () => {
    it('renders the Chinese character', () => {
      const { getByText } = render(
        <TappableText segments={[knownWord('你好', 'nǐ hǎo')]} />
      );
      expect(getByText('你好')).toBeTruthy();
    });

    it('renders the pinyin above the character', () => {
      const { getByText } = render(
        <TappableText segments={[knownWord('你好', 'nǐ hǎo')]} />
      );
      expect(getByText('nǐ hǎo')).toBeTruthy();
    });

    it('renders multiple known words', () => {
      const { getByText } = render(
        <TappableText
          segments={[knownWord('你好', 'nǐ hǎo'), knownWord('中文', 'zhōng wén')]}
        />
      );
      expect(getByText('你好')).toBeTruthy();
      expect(getByText('中文')).toBeTruthy();
    });
  });

  describe('rendering unknown characters', () => {
    it('renders unknown Chinese characters', () => {
      const { getByText } = render(
        <TappableText segments={[unknownChar('啊')]} />
      );
      expect(getByText('啊')).toBeTruthy();
    });

    it('renders punctuation and spaces', () => {
      const { getByText } = render(
        <TappableText segments={[unknownChar('，')]} />
      );
      expect(getByText('，')).toBeTruthy();
    });
  });

  describe('tapping a known word', () => {
    it('opens the WordPopup with the tapped word', () => {
      const { getByText, getByTestId } = render(
        <TappableText segments={[knownWord('你好', 'nǐ hǎo')]} />
      );
      fireEvent.press(getByText('你好'));
      expect(getByTestId('word-popup')).toBeTruthy();
      expect(getByTestId('popup-word').props.children).toBe('你好');
    });

    it('shows popup for whichever word was tapped', () => {
      const { getByText, getByTestId } = render(
        <TappableText
          segments={[knownWord('你好', 'nǐ hǎo'), knownWord('中文', 'zhōng wén')]}
        />
      );
      fireEvent.press(getByText('中文'));
      expect(getByTestId('popup-word').props.children).toBe('中文');
    });
  });

  describe('closing the popup', () => {
    it('dismisses the popup when onClose is called', () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <TappableText segments={[knownWord('你好', 'nǐ hǎo')]} />
      );
      fireEvent.press(getByText('你好'));
      expect(getByTestId('word-popup')).toBeTruthy();

      fireEvent.press(getByText('Close'));
      expect(queryByTestId('word-popup')).toBeNull();
    });
  });

  describe('empty segments', () => {
    it('renders without error when segments is empty', () => {
      expect(() => render(<TappableText segments={[]} />)).not.toThrow();
    });
  });
});
