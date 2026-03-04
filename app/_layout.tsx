import '../global.css';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '../db/database';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbReady(true);
        SplashScreen.hideAsync();
      })
      .catch((e) => {
        setError(String(e));
        SplashScreen.hideAsync();
      });
  }, []);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading…</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="lesson/[id]" options={{ title: 'Lesson' }} />
    </Stack>
  );
}
