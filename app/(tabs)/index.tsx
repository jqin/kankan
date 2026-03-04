import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useLessonStore } from '../../stores/lessonStore';

export default function HomeScreen() {
  const [inputText, setInputText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { lessons, loadLessons, createLesson } = useLessonStore();

  useEffect(() => {
    loadLessons();
  }, []);

  async function handleAnalyze() {
    const text = inputText.trim();
    if (!text) return;
    setIsCreating(true);
    try {
      const id = await createLesson(text);
      setInputText('');
      router.push(`/lesson/${id}`);
    } finally {
      setIsCreating(false);
    }
  }

  const recentLessons = lessons.slice(0, 5);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-5 pt-4">
        <Text className="text-gray-500 text-sm mb-3">
          Paste Chinese text to see pinyin and definitions.
        </Text>

        <View className="border-2 border-gray-200 rounded-2xl p-3 mb-3">
          <TextInput
            multiline
            value={inputText}
            onChangeText={setInputText}
            placeholder="粘贴中文文本…"
            placeholderTextColor="#d1d5db"
            className="text-xl text-gray-900 leading-8"
            style={{ minHeight: 120 }}
          />
        </View>

        <Pressable
          onPress={handleAnalyze}
          disabled={!inputText.trim() || isCreating}
          className={`rounded-2xl py-4 items-center mb-6 ${
            inputText.trim() && !isCreating ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              inputText.trim() && !isCreating ? 'text-white' : 'text-gray-400'
            }`}
          >
            {isCreating ? 'Analyzing…' : 'Analyze Text'}
          </Text>
        </Pressable>

        {recentLessons.length > 0 && (
          <>
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Recent Lessons
            </Text>
            <FlatList
              data={recentLessons}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push(`/lesson/${item.id}`)}
                  className="flex-row items-center py-3 border-b border-gray-100"
                >
                  <View className="flex-1">
                    <Text className="text-gray-900 text-base" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      {new Date(item.createdAt * 1000).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="text-gray-300 text-lg">›</Text>
                </Pressable>
              )}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
