import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLessonStore } from '../../stores/lessonStore';
import { segmentText } from '../../lib/segmenter';
import TappableText from '../../components/TappableText';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lessons } = useLessonStore();

  const lesson = lessons.find((l) => l.id === id);

  const segments = useMemo(() => {
    if (!lesson) return [];
    return segmentText(lesson.originalText);
  }, [lesson?.originalText]);

  if (!lesson) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-400">Lesson not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <TappableText segments={segments} />
    </ScrollView>
  );
}
