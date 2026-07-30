// ─────────────────────────────────────────────────────────────
// psychometrics.js — how a facet vector becomes an archetype.
// ─────────────────────────────────────────────────────────────
//
// This module exists because the original scoring maths had a
// systematic bias that typed ~43% of all users as Loyalist (6)
// while making Enthusiast (7), Challenger (8) and Peacemaker (9)
// effectively unreachable (<1% each).
//
// ── The two failures it replaces ──────────────────────────────
//
// ① Untouched facets scored 0.
//    Each scenario choice touches 4 facets; a user makes 16
//    choices. Facets their path never reached scored `0`, which
//    the maths read as "maximally low" — a strong false signal
//    rather than "unknown."
//
// ② Raw Euclidean distance to prototypes.
//    Distance in un-normalised facet space rewards whichever
//    prototype sits nearest the centre of the space. Measured
//    across 4,000 simulated users, correlation between a
//    prototype's standard deviation and its win rate was −0.634:
//    the flatter the prototype, the more it won. Type 6 has both
//    the lowest SD (0.170) and a mean (0.552) closest to a
//    typical user's — so it swallowed the distribution.
//
// ── The replacement ───────────────────────────────────────────
//
// Modelled on Ray Dalio's PrinciplesYou, which shares Engram's
// hierarchy (facets → domains → archetypes) and reports a *set*
// of top matches rather than one winner:
//
//   1. Neutral prior — an unseen facet is 0.5 ("unknown"), never
//      0 ("absent"). Coverage is tracked so confidence can be
//      reported honestly downstream.
//
//   2. Shape matching via Pearson correlation. Pearson mean-
//      centres and scale-normalises both vectors, so it compares
//      *relative emphasis* — which facets dominate for this
//      person — and is immune to both failure modes above.
//      This is the right question for typing: an Enneagram type
//      is a shape, not an intensity.
//
//   3. Top-N matches with a similarity percentage, so a 71%/68%
//      near-tie is visible instead of being flattened into a
//      single confident-looking answer.
//
// Intensity is deliberately *not* folded in here. Absolute facet
// magnitude is a separate signal (it feeds developmental level in
// the psyche engine), and conflating the two is what broke the
// original maths.
//
// Pure functions only — no React, no store, no side effects.
// ─────────────────────────────────────────────────────────────

/** An unseen facet is unknown, not absent. */
export const NEUTRAL = 0.5;

/** Below this many touches, a facet's score is mostly prior. */
export const MIN_TOUCHES_FOR_CONFIDENCE = 2;

/**
 * Fold assessment answers into a facet vector.
 *
 * Each answer carries a sparse `scores` map touching a handful of
 * facets. We average per facet over only the answers that
 * mentioned it, then fill the gaps with NEUTRAL.
 *
 * @param {Array<{scores: Record<string, number>}>} answers
 * @param {string[]} facetIds - canonical facet id list (order matters downstream)
 * @returns {{ scores: Record<string, number>, coverage: Record<string, number>, touched: number }}
 */
export function scoreFacets(answers, facetIds) {
  const totals = {};
  const coverage = {};
  for (const id of facetIds) {
    totals[id] = 0;
    coverage[id] = 0;
  }

  for (const answer of answers || []) {
    const scores = answer?.scores;
    if (!scores) continue;
    for (const [id, value] of Object.entries(scores)) {
      // Unknown facet ids are ignored rather than silently creating
      // dimensions the prototypes don't have.
      if (!(id in totals)) continue;
      if (!Number.isFinite(value)) continue;
      totals[id] += value;
      coverage[id] += 1;
    }
  }

  const scores = {};
  let touched = 0;
  for (const id of facetIds) {
    if (coverage[id] > 0) {
      scores[id] = totals[id] / coverage[id];
      touched += 1;
    } else {
      scores[id] = NEUTRAL;
    }
  }

  return { scores, coverage, touched };
}

/**
 * Pearson product-moment correlation between two equal-length
 * numeric vectors.
 *
 * Mean-centres and scale-normalises internally, so this measures
 * shape agreement only. Returns 0 when either vector is constant
 * (correlation is undefined there — 0 is the honest neutral).
 *
 * @returns {number} r in [-1, 1]
 */
export function pearson(a, b) {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;

  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;

  let num = 0;
  let devA = 0;
  let devB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    devA += da * da;
    devB += db * db;
  }

  const den = Math.sqrt(devA * devB);
  if (den === 0) return 0; // one vector is flat — no shape to compare
  return num / den;
}

/**
 * Convert a correlation into a human-facing similarity percentage.
 *
 * r ∈ [-1, 1] → 0–100. Negative correlation means the profile is
 * shaped *opposite* to the prototype, which is a genuine 0% match,
 * so we clamp rather than fold it back up.
 */
export function fitToPercent(r) {
  if (!Number.isFinite(r)) return 0;
  return Math.round(Math.max(0, r) * 100);
}

/**
 * Rank archetypes by how closely their signature shape matches the
 * user's facet vector.
 *
 * @param {object} params
 * @param {Record<string, number>} params.facetScores
 * @param {Record<string|number, {facets: Record<string, number>}>} params.prototypes
 * @param {string[]} params.facetIds
 * @returns {Array<{ type: number, fit: number, matchPct: number }>} sorted best-first
 */
export function matchArchetypes({ facetScores, prototypes, facetIds }) {
  const userVec = facetIds.map((id) =>
    Number.isFinite(facetScores?.[id]) ? facetScores[id] : NEUTRAL,
  );

  const results = [];
  for (const [key, proto] of Object.entries(prototypes || {})) {
    const protoFacets = proto?.facets;
    if (!protoFacets) continue;
    const protoVec = facetIds.map((id) =>
      Number.isFinite(protoFacets[id]) ? protoFacets[id] : NEUTRAL,
    );
    const fit = pearson(userVec, protoVec);
    results.push({ type: parseInt(key, 10), fit, matchPct: fitToPercent(fit) });
  }

  // Best fit first. Ties break on lower type number so results are
  // deterministic across runs — important for reproducibility.
  results.sort((a, b) => b.fit - a.fit || a.type - b.type);
  return results;
}

/**
 * Back-compat resonance map: `{ 1: 0.42, 2: 0.31, ... }`.
 *
 * The results screen, Player Card resonance bars and `getWing`
 * all read this shape. Values are the 0–1 normalised fit so the
 * existing bar widths stay meaningful.
 */
export function toResonanceMap(matches) {
  const out = {};
  for (const m of matches || []) {
    out[m.type] = Math.max(0, m.fit);
  }
  return out;
}

/**
 * How much should we trust this reading?
 *
 * Based on facet coverage — how many of the 24 facets the user's
 * path actually gathered evidence for, and how deeply.
 *
 * @returns {{ level: 'high'|'moderate'|'provisional', covered: number, total: number, ratio: number }}
 */
export function assessConfidence(coverage, facetIds) {
  const total = facetIds.length;
  let covered = 0;
  let wellCovered = 0;
  for (const id of facetIds) {
    const c = coverage?.[id] || 0;
    if (c > 0) covered += 1;
    if (c >= MIN_TOUCHES_FOR_CONFIDENCE) wellCovered += 1;
  }
  const ratio = total === 0 ? 0 : wellCovered / total;

  let level = 'provisional';
  if (ratio >= 0.75) level = 'high';
  else if (ratio >= 0.5) level = 'moderate';

  return { level, covered, total, ratio };
}

/**
 * How separated is the top match from the runner-up?
 *
 * A 71%/70% split is a genuine near-tie and should be presented as
 * one. Returns the gap in fit units plus a boolean the UI can use.
 */
export function matchClarity(matches) {
  if (!matches || matches.length < 2) {
    return { gap: 1, isClose: false };
  }
  const gap = matches[0].fit - matches[1].fit;
  return { gap, isClose: gap < 0.05 };
}

/**
 * The full typing pass — answers in, complete reading out.
 *
 * This is the single entry point IRIS uses. Everything it returns
 * beyond `facetScores` / `enneagramType` / `enneagramScores` is
 * additive, so existing consumers are unaffected.
 */
export function computeReading({ answers, prototypes, facetIds }) {
  const { scores, coverage, touched } = scoreFacets(answers, facetIds);
  const matches = matchArchetypes({
    facetScores: scores,
    prototypes,
    facetIds,
  });
  const confidence = assessConfidence(coverage, facetIds);
  const clarity = matchClarity(matches);

  return {
    facetScores: scores,
    enneagramType: matches[0]?.type ?? null,
    enneagramScores: toResonanceMap(matches),
    // ── additive ──
    matches,
    topMatches: matches.slice(0, 3),
    coverage,
    touched,
    confidence,
    clarity,
  };
}
