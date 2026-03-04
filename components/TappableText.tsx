import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { WordSegment } from '../lib/segmenter';
import WordPopup from './WordPopup';

interface Props {
  segments: WordSegment[];
}

export default function TappableText({ segments }: Props) {
  const [selected, setSelected] = useState<WordSegment | null>(null);

  return (
    <View>
      <View className="flex-row flex-wrap px-4 py-4">
        {segments.map((seg, i) => {
          if (!seg.isKnown && seg.word.trim() === '') {
            return (
              <Text key={i} className="text-2xl text-gray-800">
                {seg.word}
              </Text>
            );
          }

          if (!seg.isKnown) {
            return (
              <View key={i} className="items-center mx-0.5 mb-3">
                <Text className="text-xs text-transparent h-4">{' '}</Text>
                <Text className="text-2xl text-gray-800">{seg.word}</Text>
              </View>
            );
          }

          const isSelected = selected?.word === seg.word && selected === seg;

          return (
            <Pressable
              key={i}
              onPress={() => setSelected(seg)}
              className={`items-center mx-0.5 mb-3 px-0.5 rounded ${
                isSelected ? 'bg-blue-100' : ''
              }`}
            >
              <Text className="text-xs text-blue-500 h-4 leading-4">
                {seg.pinyin}
              </Text>
              <Text className="text-2xl text-gray-900">{seg.word}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected && (
        <WordPopup word={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}
