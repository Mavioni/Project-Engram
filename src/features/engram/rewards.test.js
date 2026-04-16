import { describe, it, expect } from 'vitest';
import { levelFromXp, xpToNext, levelProgress, XP } from './rewards.js';

describe('rewards', () => {
  describe('levelFromXp', () => {
    it('level 1 at 0 XP', () => {
      expect(levelFromXp(0)).toBe(1);
    });

    it('level 1 below 100 XP', () => {
      expect(levelFromXp(50)).toBe(1);
      expect(levelFromXp(99)).toBe(1);
    });

    it('level 2 at 100 XP', () => {
      expect(levelFromXp(100)).toBe(2);
    });

    it('level 3 at 400 XP', () => {
      expect(levelFromXp(400)).toBe(3);
    });

    it('level 4 at 900 XP', () => {
      expect(levelFromXp(900)).toBe(4);
    });

    it('handles non-numeric safely', () => {
      expect(levelFromXp(NaN)).toBe(1);
      expect(levelFromXp(-50)).toBe(1);
    });
  });

  describe('xpToNext', () => {
    it('99 XP to next at 1 XP (level 1)', () => {
      // level 1 → next boundary at 100 XP
      expect(xpToNext(1)).toBe(99);
    });

    it('0 XP to next right when you level up', () => {
      expect(xpToNext(100)).toBe(300); // level 2 → next at 400
    });
  });

  describe('levelProgress', () => {
    it('halfway through level 1 at 50 XP', () => {
      expect(levelProgress(50)).toBeCloseTo(0.5, 2);
    });

    it('at 0 progress when entering a level', () => {
      expect(levelProgress(100)).toBeCloseTo(0, 2);
      expect(levelProgress(400)).toBeCloseTo(0, 2);
    });
  });

  describe('XP amounts', () => {
    it('battle wins award more than losses', () => {
      expect(XP.battleWin).toBeGreaterThan(XP.battleLoss);
    });

    it('IRIS completion is a substantial reward', () => {
      expect(XP.irisComplete).toBeGreaterThanOrEqual(50);
    });
  });
});
