import { describe, it, expect } from 'vitest';
import { runBattle, rng, seedFrom, domainAverages, ARCHETYPE_FACETS } from './combat.js';

describe('combat', () => {
  describe('rng', () => {
    it('is deterministic for the same seed', () => {
      const a = rng(42);
      const b = rng(42);
      expect(a()).toBe(b());
      expect(a()).toBe(b());
    });

    it('produces different sequences for different seeds', () => {
      const a = rng(1);
      const b = rng(2);
      expect(a()).not.toBe(b());
    });

    it('stays in [0, 1)', () => {
      const r = rng(7);
      for (let i = 0; i < 100; i++) {
        const v = r();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe('seedFrom', () => {
    it('returns a 32-bit unsigned integer', () => {
      const h = seedFrom('E5w4::123456');
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
    });

    it('is stable for the same input', () => {
      expect(seedFrom('engram')).toBe(seedFrom('engram'));
    });
  });

  describe('domainAverages', () => {
    it('returns 6 domain keys', () => {
      const avgs = domainAverages(ARCHETYPE_FACETS[1]);
      expect(Object.keys(avgs).sort()).toEqual(
        ['cognitive', 'emotional', 'existential', 'relational', 'shadow', 'volitional'].sort(),
      );
    });

    it('computes arithmetic mean of the 4 facets per domain', () => {
      const facets = { analytical: 1, pattern: 1, abstract: 0, pragmatic: 0 };
      const avgs = domainAverages(facets);
      expect(avgs.cognitive).toBe(0.5);
    });
  });

  describe('runBattle', () => {
    it('always produces 5 rounds', () => {
      const res = runBattle({
        userFacetScores: ARCHETYPE_FACETS[5],
        archetype: 8,
        seed: 1,
      });
      expect(res.rounds).toHaveLength(5);
    });

    it('is deterministic for the same seed', () => {
      const a = runBattle({ userFacetScores: ARCHETYPE_FACETS[5], archetype: 8, seed: 42 });
      const b = runBattle({ userFacetScores: ARCHETYPE_FACETS[5], archetype: 8, seed: 42 });
      expect(a).toEqual(b);
    });

    it('returns won=true when user beats the archetype', () => {
      // A user identical to type 5 vs type 5 should tie (challenger wins on ties).
      const res = runBattle({
        userFacetScores: ARCHETYPE_FACETS[5],
        archetype: 5,
        seed: 1,
      });
      expect(res.won).toBe(true);
      expect(res.userWins).toBe(5);
    });

    it('throws on missing facet scores', () => {
      expect(() => runBattle({ archetype: 1, seed: 1 })).toThrow(/userFacetScores/);
    });

    it('throws on unknown archetype', () => {
      expect(() =>
        runBattle({ userFacetScores: ARCHETYPE_FACETS[1], archetype: 99, seed: 1 }),
      ).toThrow(/unknown archetype/);
    });

    it('userWins + oppWins always equals 5', () => {
      for (let seed = 0; seed < 20; seed++) {
        const res = runBattle({
          userFacetScores: ARCHETYPE_FACETS[2],
          archetype: 7,
          seed,
        });
        expect(res.userWins + res.oppWins).toBe(5);
      }
    });
  });
});
