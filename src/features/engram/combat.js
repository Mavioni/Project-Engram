// ─────────────────────────────────────────────────────────────
// Engram combat — the arena's battle rules.
// ─────────────────────────────────────────────────────────────
// Two engrams meet across 5 rounds. Each round picks a domain
// at random (from a seeded PRNG so battles are replayable) and
// compares the two engrams' averaged domain scores. Higher score
// wins the round; ties favor the challenger's initiative. Best
// of 5 wins the battle.
//
// Every function here is pure — no store, no DOM. Tested in
// src/features/engram/combat.test.js.
// ─────────────────────────────────────────────────────────────

import { DOMAINS, getDomainAvg, getType } from '../../data/enneagram.js';

// Archetype facet signatures — embedded here so combat runs
// without depending on the IRIS.jsx monolith. These are the same
// values used by the assessment engine to map facet space to
// enneagram types (euclidean nearest-neighbour).
export const ARCHETYPE_FACETS = {
  1: { analytical:0.85, pattern:0.6, abstract:0.5, pragmatic:0.7, depth:0.5, empathy:0.4, regulation:0.85, vulnerability:0.2, assertion:0.7, discipline:0.95, spontaneity:0.15, patience:0.5, bonding:0.4, social:0.5, autonomy:0.6, trust:0.5, purpose:0.9, identity:0.7, mortality:0.4, transcendence:0.5, anger:0.9, fear:0.4, shame:0.6, desire:0.2 },
  2: { analytical:0.3, pattern:0.5, abstract:0.3, pragmatic:0.6, depth:0.8, empathy:0.95, regulation:0.3, vulnerability:0.7, assertion:0.3, discipline:0.5, spontaneity:0.6, patience:0.6, bonding:0.95, social:0.8, autonomy:0.15, trust:0.3, purpose:0.5, identity:0.4, mortality:0.3, transcendence:0.4, anger:0.3, fear:0.4, shame:0.5, desire:0.8 },
  3: { analytical:0.6, pattern:0.7, abstract:0.4, pragmatic:0.9, depth:0.3, empathy:0.4, regulation:0.7, vulnerability:0.1, assertion:0.85, discipline:0.8, spontaneity:0.5, patience:0.3, bonding:0.3, social:0.9, autonomy:0.5, trust:0.4, purpose:0.8, identity:0.3, mortality:0.3, transcendence:0.3, anger:0.4, fear:0.5, shame:0.9, desire:0.5 },
  4: { analytical:0.4, pattern:0.8, abstract:0.8, pragmatic:0.2, depth:0.95, empathy:0.7, regulation:0.2, vulnerability:0.9, assertion:0.3, discipline:0.3, spontaneity:0.6, patience:0.4, bonding:0.8, social:0.3, autonomy:0.7, trust:0.5, purpose:0.5, identity:0.9, mortality:0.9, transcendence:0.85, anger:0.5, fear:0.5, shame:0.8, desire:0.7 },
  5: { analytical:0.95, pattern:0.9, abstract:0.9, pragmatic:0.4, depth:0.6, empathy:0.3, regulation:0.8, vulnerability:0.1, assertion:0.2, discipline:0.7, spontaneity:0.1, patience:0.85, bonding:0.2, social:0.15, autonomy:0.95, trust:0.8, purpose:0.6, identity:0.7, mortality:0.6, transcendence:0.6, anger:0.2, fear:0.7, shame:0.4, desire:0.15 },
  6: { analytical:0.7, pattern:0.6, abstract:0.4, pragmatic:0.7, depth:0.5, empathy:0.6, regulation:0.4, vulnerability:0.5, assertion:0.4, discipline:0.7, spontaneity:0.3, patience:0.6, bonding:0.6, social:0.7, autonomy:0.3, trust:0.9, purpose:0.5, identity:0.5, mortality:0.7, transcendence:0.3, anger:0.5, fear:0.95, shame:0.5, desire:0.4 },
  7: { analytical:0.4, pattern:0.6, abstract:0.7, pragmatic:0.5, depth:0.3, empathy:0.5, regulation:0.2, vulnerability:0.3, assertion:0.6, discipline:0.2, spontaneity:0.95, patience:0.1, bonding:0.4, social:0.8, autonomy:0.6, trust:0.3, purpose:0.4, identity:0.4, mortality:0.2, transcendence:0.7, anger:0.3, fear:0.3, shame:0.2, desire:0.95 },
  8: { analytical:0.5, pattern:0.5, abstract:0.3, pragmatic:0.85, depth:0.4, empathy:0.3, regulation:0.5, vulnerability:0.1, assertion:0.95, discipline:0.7, spontaneity:0.7, patience:0.2, bonding:0.3, social:0.5, autonomy:0.9, trust:0.85, purpose:0.7, identity:0.8, mortality:0.4, transcendence:0.2, anger:0.95, fear:0.2, shame:0.1, desire:0.7 },
  9: { analytical:0.3, pattern:0.5, abstract:0.5, pragmatic:0.5, depth:0.5, empathy:0.8, regulation:0.6, vulnerability:0.5, assertion:0.1, discipline:0.3, spontaneity:0.4, patience:0.9, bonding:0.6, social:0.6, autonomy:0.3, trust:0.3, purpose:0.2, identity:0.3, mortality:0.3, transcendence:0.5, anger:0.1, fear:0.4, shame:0.4, desire:0.3 },
};

/**
 * mulberry32 — tiny, fast, deterministic PRNG. Seeded by a
 * battle id so the sequence of domain picks is reproducible.
 */
export function rng(seed) {
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Convert a string (e.g. "E5w4::1234...") to a 32-bit integer
 * for seeding. Stable, collision-tolerant enough for battle
 * replayability.
 */
export function seedFrom(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Compute all 6 domain averages for a facet-score object.
 * Returns { cognitive, emotional, volitional, relational, existential, shadow }.
 */
export function domainAverages(facetScores) {
  const out = {};
  DOMAINS.forEach((d, i) => {
    out[d.id] = getDomainAvg(facetScores, i);
  });
  return out;
}

/**
 * Run a single 5-round battle between user and a target archetype (1..9).
 * `userFacetScores` is the live IRIS facet score object from the store.
 * `archetype` is an integer 1..9.
 * `seed` is an integer used to pick domains — defaults to timestamp.
 *
 * Returns:
 *   {
 *     archetype,
 *     userWins, oppWins,
 *     won,                     // boolean — user took best-of-5
 *     rounds: [{ domain, user, opp, winner: 'user'|'opp' }, ...],
 *     userAvgs, oppAvgs,       // for the stats panel
 *   }
 */
export function runBattle({ userFacetScores, archetype, seed = Date.now() }) {
  if (!userFacetScores) {
    throw new Error('runBattle: userFacetScores required');
  }
  if (!getType(archetype)) {
    throw new Error(`runBattle: unknown archetype ${archetype}`);
  }
  const oppFacets = ARCHETYPE_FACETS[archetype];
  const userAvgs = domainAverages(userFacetScores);
  const oppAvgs = domainAverages(oppFacets);

  const next = rng(seed >>> 0);
  const rounds = [];
  let userWins = 0;
  let oppWins = 0;

  // Pick 5 domains with replacement — repeating domains are fine,
  // the battle is about consistency under random scrutiny.
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(next() * DOMAINS.length);
    const d = DOMAINS[idx];
    const uVal = userAvgs[d.id];
    const oVal = oppAvgs[d.id];
    let winner;
    if (uVal > oVal) {
      winner = 'user';
      userWins += 1;
    } else if (oVal > uVal) {
      winner = 'opp';
      oppWins += 1;
    } else {
      // Exact tie — challenger (the user initiating) takes it.
      winner = 'user';
      userWins += 1;
    }
    rounds.push({ domain: d.id, domainName: d.name, user: uVal, opp: oVal, winner });
  }

  return {
    archetype,
    userWins,
    oppWins,
    won: userWins > oppWins,
    rounds,
    userAvgs,
    oppAvgs,
  };
}
