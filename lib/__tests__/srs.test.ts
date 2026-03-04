import { sm2, SRSCard } from '../srs';

const DEFAULT_CARD: SRSCard = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
};

describe('sm2', () => {
  describe('first repetition (repetitions === 0)', () => {
    it('passing (quality >= 3) sets interval to 1 and increments repetitions', () => {
      const result = sm2(4, DEFAULT_CARD);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('failing (quality < 3) resets repetitions to 0 and interval to 1', () => {
      const result = sm2(2, { ...DEFAULT_CARD, repetitions: 0 });
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });
  });

  describe('second repetition (repetitions === 1)', () => {
    it('passing sets interval to 6', () => {
      const card: SRSCard = { easeFactor: 2.5, interval: 1, repetitions: 1 };
      const result = sm2(3, card);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });
  });

  describe('third+ repetition (repetitions >= 2)', () => {
    it('passing multiplies interval by easeFactor', () => {
      const card: SRSCard = { easeFactor: 2.5, interval: 6, repetitions: 2 };
      const result = sm2(4, card);
      expect(result.interval).toBe(Math.round(6 * 2.5)); // 15
      expect(result.repetitions).toBe(3);
    });

    it('uses the input easeFactor (not the updated one) for interval calculation', () => {
      const card: SRSCard = { easeFactor: 2.0, interval: 10, repetitions: 3 };
      const result = sm2(5, card);
      // interval = round(10 * 2.0) = 20  (uses input easeFactor, not the post-update 2.1)
      expect(result.interval).toBe(Math.round(10 * 2.0)); // 20
    });
  });

  describe('failure resets progress', () => {
    it('resets repetitions to 0 and interval to 1 regardless of history', () => {
      const card: SRSCard = { easeFactor: 2.5, interval: 30, repetitions: 5 };
      const result = sm2(1, card);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('still updates easeFactor on failure', () => {
      const card: SRSCard = { easeFactor: 2.5, interval: 6, repetitions: 2 };
      const result = sm2(2, card);
      // quality=2: ef + 0.1 - 3*(0.08 + 3*0.02) = 2.5 + 0.1 - 0.42 = 2.18
      expect(result.easeFactor).toBeCloseTo(2.18, 5);
      expect(result.repetitions).toBe(0);
    });
  });

  describe('ease factor calculation', () => {
    it('quality=5 increases easeFactor by 0.1', () => {
      const result = sm2(5, DEFAULT_CARD);
      expect(result.easeFactor).toBeCloseTo(2.6, 5);
    });

    it('quality=4 leaves easeFactor unchanged', () => {
      const result = sm2(4, DEFAULT_CARD);
      expect(result.easeFactor).toBeCloseTo(2.5, 5);
    });

    it('quality=3 decreases easeFactor', () => {
      const result = sm2(3, DEFAULT_CARD);
      // ef + 0.1 - 2*(0.08 + 2*0.02) = 2.5 + 0.1 - 0.24 = 2.36
      expect(result.easeFactor).toBeCloseTo(2.36, 5);
    });

    it('quality=2 decreases easeFactor more', () => {
      const result = sm2(2, DEFAULT_CARD);
      // ef + 0.1 - 3*(0.08 + 3*0.02) = 2.5 + 0.1 - 0.42 = 2.18
      expect(result.easeFactor).toBeCloseTo(2.18, 5);
    });

    it('quality=1 decreases easeFactor significantly', () => {
      const result = sm2(1, DEFAULT_CARD);
      // ef + 0.1 - 4*(0.08 + 4*0.02) = 2.5 + 0.1 - 0.64 = 1.96
      expect(result.easeFactor).toBeCloseTo(1.96, 5);
    });

    it('quality=0 decreases easeFactor significantly', () => {
      const result = sm2(0, DEFAULT_CARD);
      // ef + 0.1 - 5*(0.08 + 5*0.02) = 2.5 + 0.1 - 0.9 = 1.7
      expect(result.easeFactor).toBeCloseTo(1.7, 5);
    });

    it('easeFactor never drops below 1.3', () => {
      const lowCard: SRSCard = { easeFactor: 1.3, interval: 1, repetitions: 0 };
      const result = sm2(0, lowCard);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(result.easeFactor).toBe(1.3);
    });

    it('easeFactor floor applies at 1.3 even with very low starting value', () => {
      const lowCard: SRSCard = { easeFactor: 1.35, interval: 1, repetitions: 0 };
      const result = sm2(0, lowCard);
      // 1.35 + 0.1 - 0.9 = 0.55, floored to 1.3
      expect(result.easeFactor).toBe(1.3);
    });
  });

  describe('nextReviewAt', () => {
    it('is set to roughly now + interval * 86400 seconds', () => {
      const before = Math.floor(Date.now() / 1000);
      const result = sm2(4, DEFAULT_CARD); // interval = 1
      const after = Math.floor(Date.now() / 1000);
      const expectedMin = before + 1 * 86400;
      const expectedMax = after + 1 * 86400;
      expect(result.nextReviewAt).toBeGreaterThanOrEqual(expectedMin);
      expect(result.nextReviewAt).toBeLessThanOrEqual(expectedMax);
    });

    it('scales with interval', () => {
      const card: SRSCard = { easeFactor: 2.5, interval: 6, repetitions: 2 };
      const before = Math.floor(Date.now() / 1000);
      const result = sm2(4, card); // interval = round(6 * 2.5) = 15
      expect(result.nextReviewAt).toBeGreaterThanOrEqual(before + 15 * 86400);
    });
  });

  describe('full progression simulation', () => {
    it('correctly advances a card through multiple reviews', () => {
      let card: SRSCard = { ...DEFAULT_CARD };

      // Review 1: Good (4)
      let r = sm2(4, card);
      expect(r.interval).toBe(1);
      expect(r.repetitions).toBe(1);
      card = r;

      // Review 2: Good (4)
      r = sm2(4, card);
      expect(r.interval).toBe(6);
      expect(r.repetitions).toBe(2);
      card = r;

      // Review 3: Good (4)
      r = sm2(4, card);
      expect(r.interval).toBe(Math.round(6 * 2.5)); // 15
      expect(r.repetitions).toBe(3);
      card = r;

      // Review 4: Fail (1)
      r = sm2(1, card);
      expect(r.interval).toBe(1);
      expect(r.repetitions).toBe(0);
    });
  });
});
