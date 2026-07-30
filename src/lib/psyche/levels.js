// ─────────────────────────────────────────────────────────────
// levels.js — developmental level approximation.
// ─────────────────────────────────────────────────────────────
// Don Riso & Russ Hudson's Levels of Development describe how
// each type expresses across a spectrum from healthy (liberated)
// to average (ego-fixated) to unhealthy (pathological).
//
// This module approximates developmental level from two signals:
//   1. Facet intensity — the raw magnitude of facet scores (how
//      strongly the personality structure is expressed). Higher
//      overall intensity correlates with more fixated expression.
//   2. Facet balance — how evenly distributed scores are across
//      domains. Extreme imbalances suggest compensatory patterns.
//
// Output: a level estimate (1-9) with a confidence note.
// Explicitly labelled as an approximation.
//
// Pure functions. No side effects.
// ─────────────────────────────────────────────────────────────

import { DOMAINS } from '../../data/enneagram.js';

/** Level bands with plain-English meaning. */
const LEVELS = [
  { range: [1, 3], band: 'Healthy', desc: 'Liberated expression. Your type\'s gifts flow naturally. Self-awareness is high; reactivity is low. You embody the best of your archetype without being trapped by it.' },
  { range: [4, 6], band: 'Average', desc: 'Ego-fixated expression. Your type\'s patterns are visible and operative. You have awareness of them but they still drive behaviour more than you\'d like. Growth is happening — and so is the pattern.' },
  { range: [7, 9], band: 'Stressed', desc: 'Reactive expression. Your type\'s core fear is driving the vehicle. Patterns feel like survival strategies rather than choices. This is where most deep work begins — you can see the mechanism now.' },
];

/**
 * @param {Record<string, number>} facetScores — 0-1 facet map
 * @returns {{
 *   level: number,                // 1-9 (1 = most healthy, 9 = most fixated)
 *   band: string,                 // 'Healthy' | 'Average' | 'Stressed'
 *   desc: string,
 *   intensity: number,            // 0-1 raw intensity score
 *   balance: number,              // 0-1 domain balance score
 *   confidence: 'tentative' | 'moderate',
 *   note: string,
 * }}
 */
export function approximateLevel(facetScores) {
  if (!facetScores) return null;

  // Intensity: mean facet score across all 24 facets.
  const facetIds = DOMAINS.flatMap((d) => d.facets);
  let intensitySum = 0;
  let count = 0;
  for (const id of facetIds) {
    const v = facetScores[id];
    if (typeof v === 'number' && Number.isFinite(v)) {
      intensitySum += v;
      count += 1;
    }
  }
  const intensity = count > 0 ? intensitySum / count : 0.5;

  // Balance: standard deviation across domain averages.
  // Lower SD = more even = healthier profile.
  const domainAvgs = DOMAINS.map((d) => {
    const vals = d.facets.map((f) => facetScores[f] ?? 0.5);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  const domainMean = domainAvgs.reduce((a, b) => a + b, 0) / domainAvgs.length;
  const domainVariance = domainAvgs.reduce((s, v) => s + (v - domainMean) ** 2, 0) / domainAvgs.length;
  const domainSD = Math.sqrt(domainVariance);
  // Normalise: typical SD range ~0.05-0.25. Map to 0-1 where 0 = balanced.
  const balance = Math.max(0, Math.min(1, 1 - domainSD / 0.28));

  // Level: combine intensity and balance.
  // High intensity + low balance → more fixated (higher level number).
  const raw = (intensity * 0.6 + (1 - balance) * 0.4) * 9;
  const level = Math.round(Math.max(1, Math.min(9, raw)));

  const band = LEVELS.find((l) => level >= l.range[0] && level <= l.range[1]);

  return {
    level,
    band: band?.band || 'Average',
    desc: band?.desc || LEVELS[1].desc,
    intensity: Math.round(intensity * 100) / 100,
    balance: Math.round(balance * 100) / 100,
    confidence: count >= 18 ? 'moderate' : 'tentative',
    note: 'Approximated from facet intensity and domain balance. Developmental level is nuanced; this is a starting point for self-inquiry, not a clinical assessment.',
  };
}
