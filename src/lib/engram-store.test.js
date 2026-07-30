import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store.js';

// These tests exercise the engram slice of the store — XP accrual,
// level boundary detection, and acknowledgeLevelUp.

const reset = () => {
  useStore.setState({
    engram: {
      xp: 0,
      level: 1,
      pendingLevelUp: null,
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

describe('engram store — acknowledgeLevelUp', () => {
  it('clears the pendingLevelUp flag', () => {
    useStore.getState().awardXp(100);
    expect(useStore.getState().engram.pendingLevelUp).toBe(2);
    useStore.getState().acknowledgeLevelUp();
    expect(useStore.getState().engram.pendingLevelUp).toBe(null);
  });
});
