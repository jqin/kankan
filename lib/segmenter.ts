import { getAllSimplified, lookupWord, DictEntry } from './dictionary';

export interface WordSegment {
  word: string;
  pinyin: string;
  definition: string;
  isKnown: boolean;
}

// Cache of all dictionary words, loaded once
let dictSet: Set<string> | null = null;
const MAX_WORD_LEN = 6;

function isChinese(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df) ||
    (code >= 0xf900 && code <= 0xfaff)
  );
}

function loadDictSet(): Set<string> {
  if (!dictSet) {
    const words = getAllSimplified();
    dictSet = new Set(words);
  }
  return dictSet;
}

export function segmentText(text: string): WordSegment[] {
  const dict = loadDictSet();
  const segments: WordSegment[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // Non-Chinese character: pass through as-is
    if (!isChinese(ch)) {
      segments.push({ word: ch, pinyin: '', definition: '', isKnown: false });
      i++;
      continue;
    }

    // Greedy forward max-match
    let matched = false;
    for (let len = Math.min(MAX_WORD_LEN, text.length - i); len > 1; len--) {
      const candidate = text.slice(i, i + len);
      if (dict.has(candidate)) {
        const entry = lookupWord(candidate);
        segments.push({
          word: candidate,
          pinyin: entry?.pinyin ?? '',
          definition: entry?.definition ?? '',
          isKnown: true,
        });
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Single character fallback
      const entry = lookupWord(ch);
      segments.push({
        word: ch,
        pinyin: entry?.pinyin ?? '',
        definition: entry?.definition ?? '',
        isKnown: entry !== null,
      });
      i++;
    }
  }

  return segments;
}

// Reset cache (useful for testing)
export function resetSegmenterCache(): void {
  dictSet = null;
}
