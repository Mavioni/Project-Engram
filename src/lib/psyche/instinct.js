// ─────────────────────────────────────────────────────────────
// instinct.js — instinctual subtype approximation.
// ─────────────────────────────────────────────────────────────
// Three instinctual drives (SP/SO/SX) shape how the core type
// expresses. No administered instrument can determine subtype
// definitively, but a facet-based approximation can suggest
// which drive is dominant with a confidence caveat.
//
// SP  (self-preservation): focus on resources, health, security,
//      comfort, routine, boundaries
// SO  (social): focus on group dynamics, belonging, status,
//      contribution, reading the room
// SX  (sexual / one-to-one): focus on intensity, chemistry,
//      attraction, merging, creative fire
//
// APPROXIMATION METHOD
// Each subtype is keyed to a weighted combination of facets.
// We compute a raw score per subtype and return the dominant
// one with a confidence estimate. Explicitly labelled as an
// approximation — not a validated instrument.
//
// Pure functions. No side effects.
// ─────────────────────────────────────────────────────────────

/** Facet weights per subtype. Domain experts mapped these to
 *  observable facet-level behaviour. */
const SUBTYPE_FACETS = {
  sp: {
    discipline: 1.2, patience: 1.1, pragmatic: 1.0,
    autonomy: 0.8, regulation: 0.7, fear: 0.5,
    analytical: 0.4, trust: 0.4,
  },
  so: {
    social: 1.2, empathy: 1.0, bonding: 0.8,
    pattern: 0.7, assertion: 0.5, shame: 0.5,
    desire: 0.4, purpose: 0.3,
  },
  sx: {
    desire: 1.2, depth: 1.1, spontaneity: 1.0,
    vulnerability: 0.8, transcendence: 0.7, anger: 0.5,
    identity: 0.5, mortality: 0.4,
  },
};

const SUBTYPE_LABELS = {
  sp: { label: 'Self-Preservation', emoji: '🏠',
    summary: 'Focused on security, resources, and physical well-being. You invest in what keeps you safe and grounded.' },
  so: { label: 'Social', emoji: '🌐',
    summary: 'Attuned to groups, belonging, and collective dynamics. You read the room and shape your place in it.' },
  sx: { label: 'One-to-One', emoji: '⚡',
    summary: 'Drawn to intensity, chemistry, and deep merging. You seek aliveness through connection and creative fire.' },
};

/**
 * @param {Record<string, number>} facetScores
 * @returns {{
 *   dominant: string,           // 'sp' | 'so' | 'sx'
 *   label: string,
 *   emoji: string,
 *   summary: string,
 *   scores: Record<string, number>,
 *   confidence: 'tentative' | 'moderate' | 'clear',
 *   note: string                // the approximation caveat
 * }}
 */
export function approximateInstinct(facetScores) {
  if (!facetScores) return null;

  const raw = {};
  for (const [subtype, weights] of Object.entries(SUBTYPE_FACETS)) {
    let sum = 0;
    let wsum = 0;
    for (const [facet, w] of Object.entries(weights)) {
      const v = facetScores[facet] ?? 0.5;
      sum += v * w;
      wsum += Math.abs(w);
    }
    raw[subtype] = wsum > 0 ? sum / wsum : 0;
  }

  // Winner
  let dominant = 'sp';
  for (const k of ['so', 'sx']) {
    if (raw[k] > raw[dominant]) dominant = k;
  }

  // Confidence: how separated is the top from the runner-up?
  const sorted = Object.entries(raw).sort((a, b) => b[1] - a[1]);
  const gap = sorted[0][1] - (sorted[1]?.[1] ?? 0);
  const confidence = gap > 0.1 ? 'clear' : gap > 0.04 ? 'moderate' : 'tentative';

  return {
    dominant,
    label: SUBTYPE_LABELS[dominant].label,
    emoji: SUBTYPE_LABELS[dominant].emoji,
    summary: SUBTYPE_LABELS[dominant].summary,
    scores: raw,
    confidence,
    note: 'Approximated from facet patterns — not a validated instrument. Subtype is nuanced and best explored with a qualified practitioner.',
  };
}
