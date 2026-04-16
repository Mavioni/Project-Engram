import { describe, it, expect } from 'vitest';
import { computeActivityLift, computeStreak, computeIrisDrift } from './patterns.js';
import { dayKey } from './time.js';

const daysAgo = (n, mood = 0.5, activities = []) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return {
    id: 'e' + n,
    day: dayKey(d),
    mood,
    activities,
  };
};

describe('computeActivityLift', () => {
  it('returns [] with fewer than 14 entries', () => {
    const entries = Array.from({ length: 10 }, (_, i) => daysAgo(i, 0.5, ['exercise']));
    expect(computeActivityLift(entries)).toEqual([]);
  });

  it('detects a positive mood lift on days with an activity', () => {
    // 14 entries: 7 with exercise at 0.8, 7 without at 0.4
    const entries = [
      ...Array.from({ length: 7 }, (_, i) => daysAgo(i, 0.8, ['exercise'])),
      ...Array.from({ length: 7 }, (_, i) => daysAgo(i + 7, 0.4, [])),
    ];
    const out = computeActivityLift(entries);
    const ex = out.find((r) => r.activityId === 'exercise');
    expect(ex).toBeDefined();
    expect(ex.lift).toBeGreaterThan(0.15);
    expect(ex.count).toBe(7);
  });

  it('ranks activities by absolute lift', () => {
    const entries = [
      // 4 days with exercise at 0.9
      ...Array.from({ length: 4 }, (_, i) => daysAgo(i, 0.9, ['exercise'])),
      // 4 days with work at 0.35 (slight negative)
      ...Array.from({ length: 4 }, (_, i) => daysAgo(i + 4, 0.35, ['work'])),
      // 6 baseline at 0.6, no tags
      ...Array.from({ length: 6 }, (_, i) => daysAgo(i + 8, 0.6, [])),
    ];
    const out = computeActivityLift(entries);
    expect(out.length).toBeGreaterThanOrEqual(2);
    // The biggest absolute lift should come first
    expect(Math.abs(out[0].lift)).toBeGreaterThanOrEqual(Math.abs(out[1].lift));
  });

  it('drops activities with fewer than 3 samples', () => {
    const entries = [
      ...Array.from({ length: 13 }, (_, i) => daysAgo(i, 0.5, [])),
      daysAgo(14, 0.9, ['rare-tag']),
      daysAgo(15, 0.9, ['rare-tag']),
    ];
    const out = computeActivityLift(entries);
    expect(out.find((r) => r.activityId === 'rare-tag')).toBeUndefined();
  });
});

describe('computeStreak', () => {
  it('returns 0 for empty', () => {
    expect(computeStreak([])).toEqual({ current: 0, longest: 0, recentlyHot: false });
  });

  it('counts a 3-day trailing streak', () => {
    const entries = [daysAgo(0, 0.5), daysAgo(1, 0.5), daysAgo(2, 0.5)];
    const { current } = computeStreak(entries);
    expect(current).toBe(3);
  });

  it('is forgiving about missing today', () => {
    const entries = [daysAgo(1, 0.5), daysAgo(2, 0.5), daysAgo(3, 0.5)];
    const { current } = computeStreak(entries);
    expect(current).toBe(3);
  });

  it('breaks at a real gap', () => {
    const entries = [daysAgo(0, 0.5), daysAgo(1, 0.5), daysAgo(3, 0.5)];
    const { current } = computeStreak(entries);
    expect(current).toBe(2);
  });

  it('finds longest streak across history', () => {
    // 5-day streak followed by a gap followed by 2-day streak
    const entries = [
      daysAgo(0, 0.5), daysAgo(1, 0.5),
      daysAgo(10, 0.5), daysAgo(11, 0.5), daysAgo(12, 0.5), daysAgo(13, 0.5), daysAgo(14, 0.5),
    ];
    const { longest } = computeStreak(entries);
    expect(longest).toBe(5);
  });

  it('recentlyHot fires at 3+', () => {
    const entries = [daysAgo(0, 0.5), daysAgo(1, 0.5), daysAgo(2, 0.5)];
    expect(computeStreak(entries).recentlyHot).toBe(true);
  });
});

describe('computeIrisDrift', () => {
  it('returns null without at least 2 snapshots', () => {
    expect(computeIrisDrift([])).toBeNull();
    expect(computeIrisDrift([{ facetScores: {} }])).toBeNull();
  });

  it('computes per-domain delta between first and latest snapshot', () => {
    const zero = Object.fromEntries([
      'analytical','pattern','abstract','pragmatic',
      'depth','empathy','regulation','vulnerability',
      'assertion','discipline','spontaneity','patience',
      'bonding','social','autonomy','trust',
      'purpose','identity','mortality','transcendence',
      'anger','fear','shame','desire',
    ].map((f) => [f, 0]));
    const later = { ...zero, anger: 1, fear: 1, shame: 1, desire: 1 };
    const drift = computeIrisDrift([
      { facetScores: zero },
      { facetScores: later },
    ]);
    expect(drift.shadow.first).toBe(0);
    expect(drift.shadow.last).toBe(1);
    expect(drift.shadow.delta).toBe(1);
    expect(drift.cognitive.delta).toBe(0);
  });
});
