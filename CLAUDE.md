# Engineering Plan: Chinese Reading App (Novli Clone)

## Project Overview

A mobile app that helps users learn to read Chinese by scanning/photographing Chinese text, providing instant word-by-word translation with pinyin, and building vocabulary through spaced-repetition flashcards.

**Target platforms:** iOS and Android
**Framework:** React Native with Expo
**Working app name:** Kankan (看看)

---

## Core User Flow

1. User pastes Chinese text OR snaps a photo of Chinese text
2. (If photo) OCR extracts Chinese characters
3. Text is segmented into words (Chinese has no spaces)
4. Words are displayed tappable — tap any word to see: pinyin, English definition, example sentences
5. One-tap to save any word to flashcard deck
6. Review flashcards with spaced repetition
7. Ask AI questions about the text
8. Listen to text read aloud with TTS

---

## Architecture

```
┌─────────────────────────────────────┐
│           React Native App          │
│  (Expo managed workflow)            │
├──────────┬──────────┬───────────────┤
│  Camera  │ UI/UX    │  Local DB     │
│  Module  │ Screens  │  (SQLite)     │
└────┬─────┴────┬─────┴───────┬───────┘
     │          │             │
     ▼          ▼             ▼
┌─────────┐ ┌────────┐ ┌───────────┐
│ OCR API │ │ Supa-  │ │ CC-CEDICT │
│ (Google │ │ base   │ │ Dictionary│
│ ML Kit) │ │ Backend│ │ (offline) │
└─────────┘ └────────┘ └───────────┘
                │
        ┌───────┴───────┐
        │  Claude API   │
        │  (AI Q&A)     │
        └───────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React Native + Expo | Cross-platform, fast iteration |
| Navigation | Expo Router | File-based routing, deep linking |
| Camera | expo-camera | Photo capture |
| OCR | Google ML Kit (react-native-mlkit-ocr) | Free, on-device, supports Chinese |
| Word Segmentation | nodejieba (via backend) OR Intl.Segmenter | Split Chinese text into words |
| Dictionary | CC-CEDICT bundled in SQLite | Free, comprehensive, offline |
| Local DB | expo-sqlite | Flashcards, lesson history, settings |
| Backend | Supabase | Auth, cloud sync, edge functions |
| AI | Anthropic Claude API | Text Q&A, contextual explanations |
| TTS | expo-speech | Native platform TTS |
| Payments | RevenueCat | Subscription management |
| State | Zustand | Lightweight global state |
| Styling | NativeWind (Tailwind for RN) | Consistent, rapid styling |

---

## Project Structure

```
kankan/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Home / scan screen
│   │   ├── lessons.tsx           # Lesson history
│   │   ├── flashcards.tsx        # Flashcard review
│   │   └── settings.tsx          # Settings
│   ├── scan/
│   │   ├── camera.tsx            # Camera capture
│   │   ├── crop.tsx              # Image crop/rotate
│   │   └── result.tsx            # Scanned text with tappable words
│   ├── lesson/
│   │   └── [id].tsx              # Single lesson view
│   └── _layout.tsx               # Root layout
├── components/
│   ├── TappableText.tsx          # Core component: renders Chinese text with tap targets
│   ├── WordPopup.tsx             # Popup showing pinyin, definition, add-to-flashcard
│   ├── FlashcardCard.tsx         # Single flashcard display (front/back flip)
│   ├── AudioButton.tsx           # TTS playback button
│   └── AIChatSheet.tsx           # Bottom sheet for AI Q&A about text
├── lib/
│   ├── ocr.ts                    # OCR processing wrapper
│   ├── segmenter.ts              # Chinese word segmentation
│   ├── dictionary.ts             # CC-CEDICT lookup
│   ├── pinyin.ts                 # Character-to-pinyin mapping
│   ├── srs.ts                    # Spaced repetition algorithm (SM-2)
│   ├── ai.ts                     # Claude API client
│   ├── tts.ts                    # Text-to-speech wrapper
│   └── supabase.ts               # Supabase client init
├── stores/
│   ├── lessonStore.ts            # Zustand store for lessons
│   ├── flashcardStore.ts         # Zustand store for flashcards
│   └── settingsStore.ts          # User preferences
├── db/
│   ├── schema.ts                 # SQLite table definitions
│   ├── migrations.ts             # DB migrations
│   └── cedict.ts                 # CC-CEDICT import/query helpers
├── assets/
│   └── cedict_ts.u8              # CC-CEDICT dictionary file
├── supabase/
│   ├── migrations/               # Supabase DB migrations
│   └── functions/
│       └── segment/              # Edge function for word segmentation
├── app.json                      # Expo config
├── package.json
└── tsconfig.json
```

---

## Database Schema

### Local SQLite

```sql
-- Lessons (scanned texts)
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  title TEXT,
  original_text TEXT NOT NULL,
  segmented_json TEXT NOT NULL,   -- JSON array of {word, pinyin, definition}
  image_uri TEXT,                 -- local path to scanned image
  folder_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  synced_at INTEGER
);

-- Folders for organizing lessons
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Flashcards
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  chinese TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  definition TEXT NOT NULL,
  example_sentence TEXT,
  reverse INTEGER DEFAULT 0,      -- 0=Chinese front, 1=English front
  -- SRS fields (SM-2)
  ease_factor REAL DEFAULT 2.5,
  interval INTEGER DEFAULT 0,     -- days until next review
  repetitions INTEGER DEFAULT 0,
  next_review INTEGER DEFAULT (unixepoch()),
  created_at INTEGER DEFAULT (unixepoch()),
  synced_at INTEGER,
  UNIQUE(chinese, reverse)        -- prevent duplicates
);

-- Dictionary (CC-CEDICT, ~120k entries)
CREATE TABLE dictionary (
  id INTEGER PRIMARY KEY,
  traditional TEXT NOT NULL,
  simplified TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  definition TEXT NOT NULL
);
CREATE INDEX idx_dict_simplified ON dictionary(simplified);
CREATE INDEX idx_dict_traditional ON dictionary(traditional);
```

### Supabase (Cloud Sync)

```sql
-- Users table (extends Supabase auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Synced lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT,
  original_text TEXT,
  segmented_json JSONB,
  folder_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Synced flashcards
CREATE TABLE flashcards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  chinese TEXT,
  pinyin TEXT,
  definition TEXT,
  ease_factor FLOAT DEFAULT 2.5,
  interval INT DEFAULT 0,
  repetitions INT DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Implementation Phases

### Phase 1: Paste & Read (MVP)

**Goal:** Paste Chinese text → see tappable words with pinyin and definitions. No camera required — validates the core reading experience quickly.

Tasks:
1. Initialize Expo project with TypeScript + Expo Router
2. Import CC-CEDICT into local SQLite at first launch
3. Build word segmentation — use `Intl.Segmenter` (available in Hermes) or a Supabase edge function running nodejieba
4. Build `TappableText` component — renders each word as a pressable, highlighted on tap
5. Build `WordPopup` component — shows pinyin, definition, audio button
6. Build home screen with paste/text-input entry point
7. Save lessons to SQLite and show lesson history list

### Phase 2: Flashcards

**Goal:** Save words and review with spaced repetition.

Tasks:
1. Implement "Add to flashcards" button in WordPopup
2. Duplicate detection — warn if word already saved
3. Build flashcard review screen with card flip animation
4. Implement SM-2 spaced repetition algorithm
5. Support reverse cards (English front → Chinese back)
6. Show review stats (cards due, streak, etc.)

### Phase 3: AI & Audio

**Goal:** Ask questions about text, listen to pronunciation.

Tasks:
1. Integrate Claude API for text Q&A (send lesson text as context)
2. Build AIChatSheet bottom sheet UI
3. Integrate expo-speech for word and sentence TTS
4. Add audio playback controls (speed, repeat)

### Phase 4: Camera & OCR

**Goal:** Snap a photo of Chinese text → feed it into the existing reading flow.

Tasks:
1. Set up camera screen with expo-camera
2. Integrate react-native-mlkit-ocr for Chinese text recognition
3. Build image crop/rotate screen
4. Connect OCR output into the existing segmentation + TappableText pipeline

### Phase 5: Organization & Polish

**Goal:** Folders, settings, and UI refinement.

Tasks:
1. Add folder management (create, rename, delete, move lessons)
2. Settings screen: font size, traditional/simplified toggle, dark mode
3. Add dark mode support with useColorScheme

### Phase 6: Auth & Cloud Sync

**Goal:** Account creation and cross-device sync.

Tasks:
1. Set up Supabase project with auth (email + Apple + Google sign-in)
2. Build auth screens (sign up, log in, forgot password)
3. Implement sync logic: local-first, push to cloud on save, pull on login
4. Conflict resolution: last-write-wins with timestamps

### Phase 7: Monetization

**Goal:** Subscription via RevenueCat.

Tasks:
1. Integrate RevenueCat SDK
2. Define free tier: 10 lessons/month, 50 flashcards, no AI
3. Define premium tier: unlimited lessons, unlimited flashcards, AI Q&A, cloud sync
4. Build paywall screen
5. Gate features based on subscription status

---

## Key Implementation Details

### Chinese Word Segmentation

The hardest technical challenge. Options ranked by preference:

1. **`Intl.Segmenter` (client-side)** — Built into modern JS engines including Hermes. Zero dependencies. Good enough for most text.
   ```typescript
   const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
   const segments = [...segmenter.segment(text)];
   ```

2. **Supabase Edge Function with jieba** — Better accuracy, handles ambiguous segmentation using statistical models. Call as API.

3. **LLM-assisted segmentation** — Send text to Claude with instructions to segment and add pinyin. Most accurate but slow and costly.

### CC-CEDICT Dictionary Setup

CC-CEDICT is a free Chinese-English dictionary (~120k entries). Format:
```
傳統 传统 [chuan2 tong3] /tradition/traditional/
```

At first app launch:
1. Parse the bundled cedict file
2. Insert all entries into SQLite
3. Store a version flag to handle future dictionary updates

### SM-2 Spaced Repetition Algorithm

```typescript
function sm2(quality: number, card: FlashcardSRS): FlashcardSRS {
  // quality: 0-5 (0=complete fail, 5=perfect)
  if (quality >= 3) {
    if (card.repetitions === 0) card.interval = 1;
    else if (card.repetitions === 1) card.interval = 6;
    else card.interval = Math.round(card.interval * card.easeFactor);
    card.repetitions++;
  } else {
    card.repetitions = 0;
    card.interval = 1;
  }
  card.easeFactor = Math.max(1.3,
    card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  card.nextReview = Date.now() + card.interval * 86400000;
  return card;
}
```

### TappableText Component (Core UX)

```typescript
// Pseudocode for the key component
function TappableText({ segments }: { segments: WordSegment[] }) {
  const [selected, setSelected] = useState<WordSegment | null>(null);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {segments.map((seg, i) => (
        <Pressable key={i} onPress={() => setSelected(seg)}>
          <View>
            <Text style={styles.pinyin}>{seg.pinyin}</Text>
            <Text style={styles.chinese}>{seg.word}</Text>
          </View>
        </Pressable>
      ))}
      {selected && (
        <WordPopup
          word={selected}
          onClose={() => setSelected(null)}
          onAddFlashcard={handleAddFlashcard}
        />
      )}
    </View>
  );
}
```

---

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
ANTHROPIC_API_KEY=xxx                    # Only used server-side in edge functions
REVENUECAT_API_KEY_IOS=xxx
REVENUECAT_API_KEY_ANDROID=xxx
```

**Important:** Never expose ANTHROPIC_API_KEY client-side. Proxy AI requests through a Supabase edge function.

---

## Commands to Get Started

```bash
# Create project
npx create-expo-app kankan --template tabs
cd kankan

# Install core dependencies
npx expo install expo-camera expo-image-picker expo-sqlite expo-speech
npm install react-native-mlkit-ocr zustand
npm install nativewind tailwindcss --save-dev
npm install @supabase/supabase-js
npm install react-native-purchases  # RevenueCat

# Set up NativeWind
npx tailwindcss init

# Run
npx expo start
```

---

## Non-Functional Requirements

- **Offline-first**: OCR, dictionary, flashcards all work without internet
- **Performance**: Dictionary lookups < 10ms, segmentation < 200ms for a paragraph
- **Accessibility**: Support dynamic text sizes, VoiceOver/TalkBack
- **Localization**: UI in English initially, Chinese and Indonesian planned
- **Privacy**: No user data collected without account creation (match Novli's stance)

---

## Out of Scope (for now)

- Handwriting recognition
- Grammar analysis
- Multiplayer / social features
- Desktop app
- Languages other than Mandarin Chinese
