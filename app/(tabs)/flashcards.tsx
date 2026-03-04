import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useFlashcardStore } from '../../stores/flashcardStore';
import FlashcardCard from '../../components/FlashcardCard';

export default function FlashcardsScreen() {
  const { flashcards, loadFlashcards, reviewCard } = useFlashcardStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFlashcards();
      setCurrentIndex(0);
      setReviewedCount(0);
      setSessionDone(false);
    }, [])
  );

  const now = Math.floor(Date.now() / 1000);
  const cardsDue = flashcards.filter((c) => c.nextReview <= now);

  function handleRate(quality: number) {
    const card = cardsDue[currentIndex];
    if (!card) return;
    reviewCard(card.id, quality);
    setReviewedCount((n) => n + 1);
    if (currentIndex + 1 >= cardsDue.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  // Empty state — no flashcards at all
  if (flashcards.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <Text className="text-5xl mb-4">🃏</Text>
        <Text className="text-xl font-semibold text-gray-700 mb-2">No Flashcards Yet</Text>
        <Text className="text-gray-400 text-center">
          Tap any word in a lesson and press "Add to Flashcards" to start building your deck.
        </Text>
      </View>
    );
  }

  // Session complete
  if (sessionDone) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <Text className="text-5xl mb-4">🎉</Text>
        <Text className="text-xl font-semibold text-gray-700 mb-2">Session Complete!</Text>
        <Text className="text-gray-500 text-center mb-2">
          Reviewed {reviewedCount} {reviewedCount === 1 ? 'card' : 'cards'}.
        </Text>
        <Text className="text-gray-400 text-sm text-center">
          {flashcards.length} total {flashcards.length === 1 ? 'card' : 'cards'} in your deck.
        </Text>
      </View>
    );
  }

  // All caught up — cards exist but none due
  if (cardsDue.length === 0) {
    const nextReview = Math.min(...flashcards.map((c) => c.nextReview));
    const nextDate = new Date(nextReview * 1000).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <Text className="text-5xl mb-4">✅</Text>
        <Text className="text-xl font-semibold text-gray-700 mb-2">All Caught Up!</Text>
        <Text className="text-gray-500 text-center mb-1">Next review: {nextDate}</Text>
        <Text className="text-gray-400 text-sm text-center">
          {flashcards.length} {flashcards.length === 1 ? 'card' : 'cards'} in your deck.
        </Text>
      </View>
    );
  }

  // Review session
  const card = cardsDue[currentIndex];
  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="px-6 pt-12 pb-10"
    >
      <Text className="text-gray-400 text-sm text-center mb-6">
        Card {currentIndex + 1} of {cardsDue.length} due
      </Text>
      <FlashcardCard key={card.id} card={card} onRate={handleRate} />
    </ScrollView>
  );
}
