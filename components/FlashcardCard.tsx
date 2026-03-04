import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Flashcard } from '../stores/flashcardStore';

interface Props {
  card: Flashcard;
  onRate: (quality: number) => void;
}

const RATINGS = [
  { label: 'Again', quality: 1, color: 'bg-red-500' },
  { label: 'Hard', quality: 2, color: 'bg-orange-400' },
  { label: 'Good', quality: 4, color: 'bg-blue-500' },
  { label: 'Easy', quality: 5, color: 'bg-green-500' },
];

export default function FlashcardCard({ card, onRate }: Props) {
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useSharedValue(0);

  function handleFlip() {
    if (flipped) return;
    setFlipped(true);
    flipAnim.value = withTiming(1, { duration: 400 });
  }

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 0.5], [0, 90]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity: flipAnim.value < 0.5 ? 1 : 0,
      position: flipAnim.value < 0.5 ? 'relative' : 'absolute',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0.5, 1], [-90, 0]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity: flipAnim.value >= 0.5 ? 1 : 0,
      position: flipAnim.value >= 0.5 ? 'relative' : 'absolute',
    };
  });

  return (
    <View className="w-full">
      {/* Card */}
      <Pressable onPress={handleFlip} disabled={flipped}>
        {/* Front */}
        <Animated.View
          style={frontStyle}
          className="bg-white rounded-3xl shadow-md p-8 items-center min-h-64 justify-center"
        >
          <Text className="text-blue-500 text-xl mb-2">{card.pinyin}</Text>
          <Text className="text-7xl font-light mb-4">{card.chinese}</Text>
          <Text className="text-gray-400 text-sm">Tap to reveal</Text>
        </Animated.View>

        {/* Back */}
        <Animated.View
          style={backStyle}
          className="bg-white rounded-3xl shadow-md p-8 items-center min-h-64 justify-center"
        >
          <Text className="text-blue-500 text-xl mb-2">{card.pinyin}</Text>
          <Text className="text-3xl font-light mb-4">{card.chinese}</Text>
          <Text className="text-gray-800 text-xl text-center">{card.definition}</Text>
        </Animated.View>
      </Pressable>

      {/* Rating buttons — only shown after flip */}
      {flipped && (
        <View className="flex-row mt-4 gap-2">
          {RATINGS.map((r) => (
            <Pressable
              key={r.quality}
              onPress={() => onRate(r.quality)}
              className={`flex-1 ${r.color} rounded-2xl py-3 items-center`}
            >
              <Text className="text-white text-sm font-semibold">{r.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
