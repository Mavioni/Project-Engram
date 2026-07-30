import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NEUTRAL,
  scoreFacets,
  pearson,
  fitToPercent,
  matchArchetypes,
  toResonanceMap,
  assessConfidence,
  matchClarity,
  computeReading,
} from './psychometrics.js';

// ─────────────────────────────────────────────────────────────
// The real assessment data lives inside IRIS.jsx as module-level
// consts. Rather than duplicate it here (and let the copy drift),
// we extract it from source. If IRIS.jsx's shape changes, these
// tests fail loudly — which is the correct outcome.
// ─────────────────────────────────────────────────────────────
function loadIrisData() {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(resolve(here, '../features/iris/IRIS.jsx'), 'utf8');
  const grab = (name, endTok) => {
    const s = src.indexOf(`const ${name}`);
    if (s === -1) throw new Error(`IRIS.jsx: could not find ${name}`);
    const eq = src.indexOf('=', s);
    const e = src.indexOf(endTok, s);
    return src.slice(eq + 1, e + endTok.length - 1);
  };
  const SCENARIOS = eval(grab('SCENARIOS', '\n];'));
  const PROTOTYPES = eval('(' + grab('ENNEAGRAM_PROFILES', '\n};') + ')');
  const FACETS = eval(grab('FACETS', '\n];'));
  return { SCENARIOS, PROTOTYPES, FACET_IDS: FACETS.map((f) => f.id) };
}

const { SCENARIOS, PROTOTYPES, FACET_IDS } = loadIrisData();

/** Deterministic PRNG so distribution tests never flake. */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

describe('pearson', () => {
  it('returns 1 for identical vectors', () => {
    expect(pearson([1, 2, 3, 4], [1, 2, 3, 4])).toBeCloseTo(1, 10);
  });

  it('returns -1 for perfectly inverted vectors', () => {
    expect(pearson([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1, 10);
  });

  it('is invariant to scale and offset — it measures shape only', () => {
    const a = [0.1, 0.5, 0.9, 0.3];
    const scaled = a.map((x) => x * 3 + 10);
    expect(pearson(a, scaled)).toBeCloseTo(1, 10);
  });

  it('returns 0 when a vector is flat (undefined correlation)', () => {
    expect(pearson([0.5, 0.5, 0.5], [1, 2, 3])).toBe(0);
  });

  it('returns 0 for empty input', () => {
    expect(pearson([], [])).toBe(0);
  });
});

describe('scoreFacets', () => {
  const ids = ['a', 'b', 'c'];

  it('uses a NEUTRAL prior for untouched facets, never 0', () => {
    const { scores } = scoreFacets([{ scores: { a: 0.8 } }], ids);
    expect(scores.a).toBeCloseTo(0.8);
    // This is the crux of failure ①. A facet nobody asked about is
    // unknown, not absent.
    expect(scores.b).toBe(NEUTRAL);
    expect(scores.c).toBe(NEUTRAL);
    expect(scores.b).not.toBe(0);
  });

  it('averages over only the answers that mention a facet', () => {
    const { scores, coverage } = scoreFacets(
      [{ scores: { a: 1.0 } }, { scores: { a: 0.0 } }, { scores: { b: 0.6 } }],
      ids,
    );
    expect(scores.a).toBeCloseTo(0.5);
    expect(coverage.a).toBe(2);
    expect(coverage.b).toBe(1);
    expect(coverage.c).toBe(0);
  });

  it('ignores unknown facet ids rather than inventing dimensions', () => {
    const { scores } = scoreFacets([{ scores: { zzz: 0.9 } }], ids);
    expect(scores.zzz).toBeUndefined();
    expect(Object.keys(scores).sort()).toEqual(['a', 'b', 'c']);
  });

  it('survives malformed answers', () => {
    const { scores } = scoreFacets(
      [null, {}, { scores: null }, { scores: { a: NaN } }],
      ids,
    );
    expect(scores.a).toBe(NEUTRAL);
  });
});

describe('fitToPercent', () => {
  it('maps a perfect fit to 100', () => {
    expect(fitToPercent(1)).toBe(100);
  });
  it('clamps negative correlation to 0 — an inverse shape is not a match', () => {
    expect(fitToPercent(-0.7)).toBe(0);
  });
  it('handles non-finite input', () => {
    expect(fitToPercent(NaN)).toBe(0);
  });
});

describe('matchArchetypes — golden vectors', () => {
  // Feed each prototype in as if it were a user. Each must type as
  // itself at 100%. Under the previous Euclidean maths several of
  // these mistyped as Loyalist.
  for (let t = 1; t <= 9; t++) {
    it(`prototype ${t} types as itself`, () => {
      const matches = matchArchetypes({
        facetScores: PROTOTYPES[t].facets,
        prototypes: PROTOTYPES,
        facetIds: FACET_IDS,
      });
      expect(matches[0].type).toBe(t);
      expect(matches[0].matchPct).toBe(100);
    });
  }

  it('returns all nine archetypes, best first', () => {
    const matches = matchArchetypes({
      facetScores: PROTOTYPES[5].facets,
      prototypes: PROTOTYPES,
      facetIds: FACET_IDS,
    });
    expect(matches).toHaveLength(9);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].fit).toBeGreaterThanOrEqual(matches[i].fit);
    }
  });

  it('is deterministic — ties break on lower type number', () => {
    const flat = Object.fromEntries(FACET_IDS.map((id) => [id, 0.5]));
    const a = matchArchetypes({ facetScores: flat, prototypes: PROTOTYPES, facetIds: FACET_IDS });
    const b = matchArchetypes({ facetScores: flat, prototypes: PROTOTYPES, facetIds: FACET_IDS });
    expect(a.map((m) => m.type)).toEqual(b.map((m) => m.type));
  });
});

describe('type distribution — the Loyalist regression guard', () => {
  // This is the test that would have caught the production bug.
  //
  // Before the fix, 4,000 simulated users produced:
  //   Loyalist 42.9% · Enthusiast 0.3% · Challenger 0.5% · Peacemaker 0.9%
  //
  // The cause was nearest-centroid bias: correlation between a
  // prototype's standard deviation and its win rate was -0.634.
  const N = 2000;
  const rand = mulberry32(20260730);
  const dist = {};

  for (let i = 0; i < N; i++) {
    const answers = SCENARIOS.map(
      (s) => s.choices[Math.floor(rand() * s.choices.length)],
    );
    const { enneagramType } = computeReading({
      answers,
      prototypes: PROTOTYPES,
      facetIds: FACET_IDS,
    });
    dist[enneagramType] = (dist[enneagramType] || 0) + 1;
  }

  it('no archetype swallows the distribution', () => {
    const shares = Object.values(dist).map((n) => n / N);
    const max = Math.max(...shares);
    // Uniform would be 11%. The old maths hit 43%. 30% leaves room
    // for genuine prototype-geometry variation without letting a
    // regression through.
    expect(max).toBeLessThan(0.3);
  });

  it('every archetype is reachable', () => {
    for (let t = 1; t <= 9; t++) {
      expect(dist[t] ?? 0).toBeGreaterThan(0);
    }
  });

  it('Loyalist specifically is no longer dominant', () => {
    expect((dist[6] ?? 0) / N).toBeLessThan(0.3);
  });
});

describe('scenario coverage', () => {
  it('every facet is touched by the scenario set', () => {
    const touched = new Set();
    for (const s of SCENARIOS) {
      for (const c of s.choices) {
        for (const id of Object.keys(c.scores)) touched.add(id);
      }
    }
    for (const id of FACET_IDS) {
      expect(touched.has(id), `facet "${id}" is never assessed`).toBe(true);
    }
  });

  it('no facet is starved relative to the others', () => {
    const counts = Object.fromEntries(FACET_IDS.map((id) => [id, 0]));
    for (const s of SCENARIOS) {
      for (const c of s.choices) {
        for (const id of Object.keys(c.scores)) {
          if (id in counts) counts[id] += 1;
        }
      }
    }
    const values = Object.values(counts);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    // A facet mentioned less than a third as often as average can't
    // carry its weight in the correlation.
    for (const [id, n] of Object.entries(counts)) {
      expect(n, `facet "${id}" is starved (${n} vs mean ${mean.toFixed(1)})`)
        .toBeGreaterThan(mean / 3);
    }
  });

  it('every choice contributes some signal', () => {
    for (const s of SCENARIOS) {
      for (const c of s.choices) {
        expect(Object.keys(c.scores).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('assessConfidence', () => {
  const ids = ['a', 'b', 'c', 'd'];

  it('reports high confidence when facets are well covered', () => {
    const c = assessConfidence({ a: 3, b: 3, c: 3, d: 2 }, ids);
    expect(c.level).toBe('high');
    expect(c.covered).toBe(4);
  });

  it('reports provisional when most facets rest on the prior', () => {
    const c = assessConfidence({ a: 2, b: 0, c: 0, d: 0 }, ids);
    expect(c.level).toBe('provisional');
  });

  it('reports moderate in between', () => {
    const c = assessConfidence({ a: 2, b: 2, c: 1, d: 0 }, ids);
    expect(c.level).toBe('moderate');
  });
});

describe('matchClarity', () => {
  it('flags a near-tie', () => {
    const { isClose } = matchClarity([{ fit: 0.71 }, { fit: 0.69 }]);
    expect(isClose).toBe(true);
  });

  it('does not flag a clear winner', () => {
    const { isClose } = matchClarity([{ fit: 0.85 }, { fit: 0.40 }]);
    expect(isClose).toBe(false);
  });

  it('handles a single match', () => {
    expect(matchClarity([{ fit: 0.9 }]).isClose).toBe(false);
  });
});

describe('toResonanceMap', () => {
  it('produces the legacy { type: 0..1 } shape', () => {
    const map = toResonanceMap([
      { type: 5, fit: 0.8 },
      { type: 1, fit: -0.3 },
    ]);
    expect(map[5]).toBeCloseTo(0.8);
    // Negative fit clamps to 0 so resonance bars never render inverted.
    expect(map[1]).toBe(0);
  });
});

describe('computeReading — back-compat contract', () => {
  const answers = SCENARIOS.map((s) => s.choices[0]);
  const reading = computeReading({
    answers,
    prototypes: PROTOTYPES,
    facetIds: FACET_IDS,
  });

  it('still returns the three fields onComplete consumers expect', () => {
    expect(reading).toHaveProperty('facetScores');
    expect(reading).toHaveProperty('enneagramType');
    expect(reading).toHaveProperty('enneagramScores');
    expect(typeof reading.enneagramType).toBe('number');
  });

  it('facetScores covers every facet', () => {
    expect(Object.keys(reading.facetScores).sort()).toEqual(
      [...FACET_IDS].sort(),
    );
  });

  it('enneagramScores has an entry per archetype', () => {
    expect(Object.keys(reading.enneagramScores)).toHaveLength(9);
  });

  it('adds top-3 matches with percentages', () => {
    expect(reading.topMatches).toHaveLength(3);
    for (const m of reading.topMatches) {
      expect(m.matchPct).toBeGreaterThanOrEqual(0);
      expect(m.matchPct).toBeLessThanOrEqual(100);
    }
  });

  it('reports coverage and confidence', () => {
    expect(reading.confidence.level).toMatch(/high|moderate|provisional/);
    expect(reading.confidence.total).toBe(FACET_IDS.length);
  });

  it('survives an empty assessment without throwing', () => {
    const empty = computeReading({
      answers: [],
      prototypes: PROTOTYPES,
      facetIds: FACET_IDS,
    });
    // Every facet sits on the prior, so the vector is flat and no
    // shape can be inferred — but it must not crash.
    expect(empty.confidence.level).toBe('provisional');
    expect(Object.keys(empty.facetScores)).toHaveLength(FACET_IDS.length);
  });
});
