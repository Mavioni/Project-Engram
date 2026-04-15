import { describe, it, expect } from 'vitest';
import { dayKey, fromDayKey, last, currentStreak, daysBetween } from './time.js';

describe('time helpers', () => {
  describe('dayKey', () => {
    it('formats a Date as YYYY-MM-DD', () => {
      expect(dayKey(new Date(2026, 3, 15))).toBe('2026-04-15');
    });

    it('defaults to today', () => {
      const now = new Date();
      const key = dayKey();
      // Zero-padded match
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(key).toBe(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      );
    });
  });

  describe('fromDayKey', () => {
    it('round-trips with dayKey', () => {
      const src = '2026-04-15';
      expect(dayKey(fromDayKey(src))).toBe(src);
    });
  });

  describe('last', () => {
    it('returns n days ending at "from", oldest-first', () => {
      const from = new Date(2026, 3, 15); // Apr 15
      const days = last(5, from);
      expect(days).toHaveLength(5);
      expect(dayKey(days[0])).toBe('2026-04-11');
      expect(dayKey(days[days.length - 1])).toBe('2026-04-15');
    });
  });

  describe('currentStreak', () => {
    const mkEntry = (d) => ({
      id: d.toISOString(),
      day: dayKey(d),
      mood: 3,
      activities: [],
      notes: [],
    });
    const daysAgo = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d;
    };

    it('returns 0 for empty input', () => {
      expect(currentStreak([])).toBe(0);
      expect(currentStreak(null)).toBe(0);
    });

    it('counts a single-day streak', () => {
      expect(currentStreak([mkEntry(daysAgo(0))])).toBe(1);
    });

    it('counts a 3-day run ending today', () => {
      const entries = [0, 1, 2].map((i) => mkEntry(daysAgo(i)));
      expect(currentStreak(entries)).toBe(3);
    });

    it('is forgiving about "no entry yet today" — yesterday still counts', () => {
      const entries = [1, 2].map((i) => mkEntry(daysAgo(i)));
      expect(currentStreak(entries)).toBe(2);
    });

    it('breaks the streak at the first missing day', () => {
      const entries = [0, 1, 3, 4].map((i) => mkEntry(daysAgo(i)));
      expect(currentStreak(entries)).toBe(2);
    });
  });

  describe('daysBetween', () => {
    it('counts whole calendar days', () => {
      const a = new Date(2026, 3, 15);
      const b = new Date(2026, 3, 10);
      expect(daysBetween(a, b)).toBe(5);
    });
  });
});
