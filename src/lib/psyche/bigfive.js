// ─────────────────────────────────────────────────────────────
// bigfive.js — Big Five (OCEAN) approximation from facet overlap.
// ─────────────────────────────────────────────────────────────
// WARNING: this is an approximation, not a validated instrument.
// The Big Five was developed through lexical analysis (Allport,
// Cattell, Goldberg, Costa & McCrae) and validated across
// cultures with tens of thousands of subjects. The mapping below
// is derived from conceptual overlap between IRIS facets and
// established Big Five facets — it is directional, not diagnostic.
//
// O — Openness to experience
// C — Conscientiousness
// E — Extraversion
// A — Agreeableness
// N — Neuroticism (emotional stability, reversed)
//
// Confidence: 'low' — this is a conceptual bridge, not a
// psychometrically validated conversion. Present it as a
// curiosity, not a result.
//
// Pure function. No side effects.
// ─────────────────────────────────────────────────────────────

/**
 * Facet → Big Five dimension mapping with weights.
 * Derived from conceptual overlap analysis between IRIS's 24
 * facets and the NEO-PI-R's 30 facet scales.
 */
const B5_MAP = {
  // Openness: curiosity, imagination, aesthetic sensitivity,
  //          preference for variety
  O: {
    abstract: 1.0, transcendence: 0.9, pattern: 0.7,
    spontaneity: 0.6, depth: 0.5, mortality: 0.3,
    identity: 0.3, purpose: 0.2,
    // negative loadings (conventionality pulls O down)
    pragmatic: -0.5, discipline: -0.3, trust: -0.2,
  },
  // Conscientiousness: self-discipline, order, achievement-
  //                    striving, deliberation
  C: {
    discipline: 1.0, analytical: 0.7, pragmatic: 0.6,
    regulation: 0.5, patience: 0.5, purpose: 0.4,
    identity: 0.3, assertion: 0.3,
    spontaneity: -0.5, desire: -0.3,
  },
  // Extraversion: warmth, gregariousness, assertiveness,
  //              activity, excitement-seeking
  E: {
    social: 1.0, assertion: 0.9, spontaneity: 0.7,
    desire: 0.6, bonding: 0.5, empathy: 0.3,
    // introversion pulls E down
    autonomy: -0.6, patience: -0.3, regulation: -0.2,
  },
  // Agreeableness: trust, straightforwardness, altruism,
  //               compliance, modesty, tender-mindedness
  A: {
    empathy: 1.0, bonding: 0.9, trust: 0.8,
    vulnerability: 0.4, patience: 0.3,
    anger: -0.7, assertion: -0.5, autonomy: -0.3,
    shame: 0.3, // modest self-assessment loads positively
  },
  // Neuroticism: anxiety, hostility, depression, self-
  //             consciousness, impulsiveness, vulnerability
  N: {
    fear: 1.0, shame: 0.9, anger: 0.6,
    depth: 0.5, // emotional intensity
    vulnerability: 0.5, mortality: 0.3,
    regulation: -0.8, identity: -0.4, patience: -0.3,
    trust: -0.3,
  },
};

const B5_LABELS = {
  O: { name: 'Openness', low: 'Conventional', high: 'Exploratory' },
  C: { name: 'Conscientiousness', low: 'Flexible', high: 'Ordered' },
  E: { name: 'Extraversion', low: 'Reserved', high: 'Engaged' },
  A: { name: 'Agreeableness', low: 'Challenging', high: 'Cooperative' },
  N: { name: 'Neuroticism', low: 'Resilient', high: 'Reactive' },
};

const DISCLAIMER = 'Approximation from facet overlap — not a validated Big Five instrument. Treat as a directional curiosity, not a clinical or selection result.';

/**
 * @param {Record<string, number>} facetScores — 0-1 facet map
 * @returns {{
 *   scores: Record<string, {name: string, percentile: number, label: string}>,
 *   disclaimer: string,
 * }}
 */
export function approximateBigFive(facetScores) {
  if (!facetScores) return null;

  const scores = {};
  for (const [dim, weights] of Object.entries(B5_MAP)) {
    let sum = 0;
    let wsum = 0;
    for (const [facet, w] of Object.entries(weights)) {
      const v = facetScores[facet] ?? 0.5;
      sum += v * w;
      wsum += Math.abs(w);
    }
    // Normalise to 0-1, then map to percentile-ish 0-100.
    const raw = wsum > 0 ? (sum / wsum + 1) / 2 : 0.5; // shift from [-1,1] to [0,1]
    const percentile = Math.round(Math.max(0, Math.min(100, raw * 100)));
    scores[dim] = {
      name: B5_LABELS[dim].name,
      percentile,
      label: percentile > 60 ? B5_LABELS[dim].high : percentile < 40 ? B5_LABELS[dim].low : 'Balanced',
    };
  }

  return { scores, disclaimer: DISCLAIMER };
}
