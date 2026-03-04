export interface SRSCard {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

// quality: 0–5  (0-2 = failed, 3-5 = passed)
export function sm2(quality: number, card: SRSCard): SRSCard & { nextReviewAt: number } {
  let { easeFactor, interval, repetitions } = card;
  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );
  const nextReviewAt = Math.floor(Date.now() / 1000) + interval * 86400;
  return { easeFactor, interval, repetitions, nextReviewAt };
}
