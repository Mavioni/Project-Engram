// ─────────────────────────────────────────────────────────────
// tritype.js — one archetype per centre of intelligence.
// ─────────────────────────────────────────────────────────────
// Tritype theory (Katherine Fauvre): every person has a dominant
// type in each of the three centres:
//   Gut  (8-9-1): instinctive, body-based, anger/autonomy
//   Heart (2-3-4): feeling, image, shame/identity
//   Head  (5-6-7): thinking, fear, security
//
// This module determines the user's tritype from IRIS enneagram
// scores — already computed by psychometrics.js as a resonance
// map. For each centre we pick the highest-scoring type.
//
// Pure function. No side effects.
// ─────────────────────────────────────────────────────────────

/** Centre groupings. Order within each centre matches the
 *  Enneagram symbol's geometry. */
export const CENTRES = {
  gut:   [8, 9, 1],
  heart: [2, 3, 4],
  head:  [5, 6, 7],
};

/** Canonical ordering for display: gut → heart → head = 8-2-5,
 *  9-3-6, etc. All 27 combinations have established names. */
export const TRITYPE_NAMES = {
  '1-2-5': 'The Mentor',      '1-2-6': 'The Conscience',   '1-2-7': 'The Optimist',
  '1-3-5': 'The Technician',  '1-3-6': 'The Taskmaster',   '1-3-7': 'The Systems Builder',
  '1-4-5': 'The Researcher',  '1-4-6': 'The Philosopher',  '1-4-7': 'The Visionary',
  '9-2-5': 'The Peacekeeper', '9-2-6': 'The Good Samaritan', '9-2-7': 'The Peacemaker-Dreamer',
  '9-3-5': 'The Thinker',     '9-3-6': 'The Mediator',     '9-3-7': 'The Ambassador',
  '9-4-5': 'The Contemplative','9-4-6': 'The Seeker',     '9-4-7': 'The Imagination',
  '8-2-5': 'The Strategist',  '8-2-6': 'The Protector',    '8-2-7': 'The Entrepreneur',
  '8-3-5': 'The Commander',   '8-3-6': 'The Justice Fighter','8-3-7': 'The Trailblazer',
  '8-4-5': 'The Visionary-Intense','8-4-6': 'The Truth Teller','8-4-7': 'The Maverick',
};

/**
 * @param {Record<number, number>} enneagramScores — resonance map, e.g. {1:0.7, 2:0.3, ...}
 * @returns {{
 *   tritype: [number, number, number],  // [gut, heart, head]
 *   tritypeKey: string,                  // "8-3-5"
 *   tritypeName: string,                 // "The Commander"
 *   centres: Record<string, {type: number, score: number}[]>
 * }}
 */
export function computeTritype(enneagramScores) {
  if (!enneagramScores) return null;

  const out = {};
  for (const [centre, types] of Object.entries(CENTRES)) {
    let best = null;
    for (const t of types) {
      const s = enneagramScores[t] ?? 0;
      if (!best || s > best.score) best = { type: t, score: s };
    }
    out[centre] = best;
  }

  const tritype = [
    out.gut.type,
    out.heart.type,
    out.head.type,
  ];
  const tritypeKey = tritype.join('-');
  const tritypeName = TRITYPE_NAMES[tritypeKey] || 'The Original';

  return {
    tritype,
    tritypeKey,
    tritypeName,
    centres: {
      gut: rankedInCentre(enneagramScores, CENTRES.gut),
      heart: rankedInCentre(enneagramScores, CENTRES.heart),
      head: rankedInCentre(enneagramScores, CENTRES.head),
    },
  };
}

function rankedInCentre(scores, types) {
  return types
    .map((t) => ({ type: t, score: scores[t] ?? 0 }))
    .sort((a, b) => b.score - a.score);
}
