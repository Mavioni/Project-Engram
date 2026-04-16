import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store.js';

// These tests exercise the engram slice of the store — XP accrual,
// level boundary detection, daily-challenge seeding, and the
// acknowledgeLevelUp / recordBattle side effects.

const reset = () => {
  useStore.setState({
    engram: {
      xp: 0,
      level: 1,
      defeated: [],
      battleHistory: [],
      pendingLevelUp: null,
      dailyChallenge: null,
    },
    iris: {
      facetScores: null,
      enneagramType: null,
      enneagramScores: null,
      takenAt: null,
      history: [],
    },
  });
};

beforeEach(reset);

describe('engram store — awardXp', () => {
  it('adds XP', () => {
    useStore.getState().awardXp(25);
    expect(useStore.getState().engram.xp).toBe(25);
  });

  it('ignores negative / non-integer amounts', () => {
    useStore.getState().awardXp(-10);
    useStore.getState().awardXp(7.5); // `| 0` truncates, so 7
    expect(useStore.getState().engram.xp).toBe(7);
  });

  it('recomputes level', () => {
    useStore.getState().awardXp(150);
    // levelFromXp(150) = floor(sqrt(1.5)) + 1 = 1 + 1 = 2
    expect(useStore.getState().engram.level).toBe(2);
  });

  it('flags pendingLevelUp when a boundary is crossed', () => {
    useStore.getState().awardXp(99);
    expect(useStore.getState().engram.pendingLevelUp).toBe(null);
    useStore.getState().awardXp(2); // crosses 100
    expect(useStore.getState().engram.pendingLevelUp).toBe(2);
  });

  it('does not re-flag pendingLevelUp if no boundary is crossed', () => {
    useStore.getState().awardXp(150); // level 2, pending 2
    useStore.getState().acknowledgeLevelUp();
    useStore.getState().awardXp(50); // still level 2
    expect(useStore.getState().engram.pendingLevelUp).toBe(null);
  });
});

describe('engram store — recordBattle', () => {
  it('awards 100 XP on a win and adds the seal', () => {
    useStore.getState().recordBattle({
      archetype: 5,
      won: true,
      userWins: 3,
      oppWins: 2,
      rounds: [],
    });
    const eg = useStore.getState().engram;
    expect(eg.xp).toBe(100);
    expect(eg.defeated).toEqual([5]);
    expect(eg.pendingLevelUp).toBe(2);
  });

  it('awards 25 XP on a loss and does not add a seal', () => {
    useStore.getState().recordBattle({
      archetype: 8,
      won: false,
      userWins: 1,
      oppWins: 4,
      rounds: [],
    });
    const eg = useStore.getState().engram;
    expect(eg.xp).toBe(25);
    expect(eg.defeated).toEqual([]);
  });

  it('de-dupes seals when beating the same archetype twice', () => {
    const { recordBattle } = useStore.getState();
    recordBattle({ archetype: 3, won: true, userWins: 3, oppWins: 2, rounds: [] });
    recordBattle({ archetype: 3, won: true, userWins: 3, oppWins: 2, rounds: [] });
    expect(useStore.getState().engram.defeated).toEqual([3]);
  });

  it('caps battle history at 30 entries', () => {
    const { recordBattle } = useStore.getState();
    for (let i = 0; i < 35; i++) {
      recordBattle({ archetype: (i % 9) + 1, won: i % 2 === 0, userWins: 3, oppWins: 2, rounds: [] });
    }
    expect(useStore.getState().engram.battleHistory).toHaveLength(30);
  });

  it('completes the daily challenge when user wins the matching type', () => {
    useStore.setState({
      engram: {
        ...useStore.getState().engram,
        dailyChallenge: { day: '2026-04-20', archetype: 4, completed: false },
      },
    });
    useStore.getState().recordBattle({
      archetype: 4,
      won: true,
      userWins: 3,
      oppWins: 2,
      rounds: [],
    });
    expect(useStore.getState().engram.dailyChallenge.completed).toBe(true);
  });

  it('does not complete the daily challenge when you beat a different type', () => {
    useStore.setState({
      engram: {
        ...useStore.getState().engram,
        dailyChallenge: { day: '2026-04-20', archetype: 4, completed: false },
      },
    });
    useStore.getState().recordBattle({
      archetype: 7,
      won: true,
      userWins: 3,
      oppWins: 2,
      rounds: [],
    });
    expect(useStore.getState().engram.dailyChallenge.completed).toBe(false);
  });
});

describe('engram store — acknowledgeLevelUp', () => {
  it('clears the pendingLevelUp flag', () => {
    useStore.getState().awardXp(100);
    expect(useStore.getState().engram.pendingLevelUp).toBe(2);
    useStore.getState().acknowledgeLevelUp();
    expect(useStore.getState().engram.pendingLevelUp).toBe(null);
  });
});

describe('engram store — ensureDailyChallenge', () => {
  it('creates a challenge when none exists', () => {
    useStore.setState({
      iris: {
        facetScores: {},
        enneagramType: 5,
        enneagramScores: {},
        takenAt: null,
        history: [],
      },
    });
    useStore.getState().ensureDailyChallenge();
    const dc = useStore.getState().engram.dailyChallenge;
    expect(dc).toBeTruthy();
    expect(dc.archetype).toBeGreaterThanOrEqual(1);
    expect(dc.archetype).toBeLessThanOrEqual(9);
    expect(dc.archetype).not.toBe(5); // excludes user's own type
    expect(dc.completed).toBe(false);
  });

  it('is deterministic for the same day', () => {
    useStore.setState({
      iris: {
        facetScores: {},
        enneagramType: 5,
        enneagramScores: {},
        takenAt: null,
        history: [],
      },
    });
    useStore.getState().ensureDailyChallenge();
    const first = useStore.getState().engram.dailyChallenge;
    // Force overwrite-ish: wipe and re-seed on the same day
    useStore.setState({
      engram: { ...useStore.getState().engram, dailyChallenge: null },
    });
    useStore.getState().ensureDailyChallenge();
    const second = useStore.getState().engram.dailyChallenge;
    expect(first.archetype).toBe(second.archetype);
  });
});
