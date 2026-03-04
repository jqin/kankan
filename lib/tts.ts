import * as Speech from 'expo-speech';

export function speakChinese(text: string, callbacks?: Speech.SpeechEventCallback): void {
  Speech.stop();
  Speech.speak(text, { language: 'zh-CN', ...callbacks });
}

export function stopSpeaking(): void {
  Speech.stop();
}
