import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { WordSegment } from '../lib/segmenter';
import { useFlashcardStore } from '../stores/flashcardStore';
import AudioButton from './AudioButton';

interface Props {
  word: WordSegment;
  onClose: () => void;
}

export default function WordPopup({ word, onClose }: Props) {
  const [added, setAdded] = useState(false);
  const addFlashcard = useFlashcardStore((s) => s.addFlashcard);

  function handleAddFlashcard() {
    const result = addFlashcard(word.word, word.pinyin, word.definition ?? '');
    if (result === 'duplicate') {
      Alert.alert('Already saved', 'This word is already in your flashcards.');
    } else {
      setAdded(true);
      setTimeout(() => onClose(), 1000);
    }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/40">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl px-6 pt-4 pb-10">
              {/* Handle bar */}
              <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />

              {/* Close button */}
              <Pressable
                onPress={onClose}
                className="absolute top-4 right-5 p-2"
                hitSlop={8}
              >
                <Text className="text-2xl text-gray-400">✕</Text>
              </Pressable>

              {/* Word display */}
              <View className="items-center mb-6 mt-2">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-blue-500 text-lg">{word.pinyin}</Text>
                  <AudioButton text={word.word} size="sm" />
                </View>
                <Text className="text-6xl font-light mb-3">{word.word}</Text>
                <Text className="text-gray-700 text-lg text-center px-4">
                  {word.definition || 'No definition available'}
                </Text>
              </View>

              {/* Add to flashcard button */}
              <Pressable
                onPress={added ? undefined : handleAddFlashcard}
                className={added ? 'bg-green-500 rounded-2xl py-4 items-center' : 'bg-blue-500 rounded-2xl py-4 items-center'}
              >
                <Text className="text-white text-base font-semibold">
                  {added ? '✓ Added!' : '+ Add to Flashcards'}
                </Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
