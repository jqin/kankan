import React, { useState, useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { speakChinese, stopSpeaking } from '../lib/tts';

interface Props {
  text: string;
  size?: 'sm' | 'lg';
}

export default function AudioButton({ text, size = 'sm' }: Props) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [text]);

  function handlePress() {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
    } else {
      speakChinese(text, {
        onDone: () => setPlaying(false),
        onStopped: () => setPlaying(false),
        onError: () => setPlaying(false),
      });
      setPlaying(true);
    }
  }

  const dimension = size === 'lg' ? 36 : 32;

  return (
    <Pressable
      onPress={handlePress}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        backgroundColor: playing ? '#dbeafe' : '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size === 'lg' ? 18 : 16 }}>
        {playing ? '■' : '🔊'}
      </Text>
    </Pressable>
  );
}
