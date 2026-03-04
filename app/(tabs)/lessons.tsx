import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useLessonStore } from '../../stores/lessonStore';

export default function LessonsScreen() {
  const { lessons, loadLessons, deleteLesson } = useLessonStore();

  useEffect(() => {
    loadLessons();
  }, []);

  function handleDelete(id: string, title: string) {
    Alert.alert('Delete Lesson', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteLesson(id),
      },
    ]);
  }

  if (lessons.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-4xl mb-4">📖</Text>
        <Text className="text-gray-400 text-center">
          No lessons yet. Paste some Chinese text on the Home tab to get started.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/lesson/${item.id}`)}
            onLongPress={() => handleDelete(item.id, item.title)}
            className="flex-row items-center px-5 py-4 border-b border-gray-100 active:bg-gray-50"
          >
            <View className="flex-1">
              <Text className="text-gray-900 text-base font-medium" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-gray-400 text-xs mt-1">
                {new Date(item.createdAt * 1000).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <Text className="text-gray-300 text-xl">›</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
