// ─────────────────────────────────────────────────────────────
// Self Mirror — baseline-vs-recent drift (LLR / Dunning's G²).
// ─────────────────────────────────────────────────────────────
// Operator selection for ADR §9's drift-threshold slot:
//   (d) Log-likelihood ratio — standard in corpus linguistics,
//       robust against low-frequency terms, well-behaved edge
//       cases. DEFAULT_LLR_THRESHOLD = 10.83 is the χ²(1 dof)
//       critical value for p<0.001.
//
// Algorithm (per phrase appearing in current OR baseline):
//   contingency table
//                         phrase   not-phrase
//     current window         a          b
//     baseline window        c          d
//   N = a + b + c + d, totalCurrent = a+b, totalBaseline = c+d,
//   totalPhrase = a+c, totalOther = b+d.
//   E_a = totalCurrent * totalPhrase / N   (and analogous for b, c, d)
//   G² = 2 * (a·ln(a/E_a) + b·ln(b/E_b) + c·ln(c/E_c) + d·ln(d/E_d))
//   using the convention 0·ln(0/x) = 0.
//
// Buckets:
//   added  : c === 0 && a > 0. Sorted by current count desc. Not
//            filtered by G² (they are distinct by construction).
//   rising : c > 0 && G² > threshold && a > E_a. Sorted by G² desc.
//   fading : G² > threshold && a < E_a. Sorted by G² desc.
//
// Edge cases:
//   - Empty current  → all-empty drift (not degenerate "everything
//     faded"; there is nothing to contrast against).
//   - Empty baseline → every current phrase is `added`.
//   - N === 0 → all-empty (no division by zero).
// ─────────────────────────────────────────────────────────────

/**
 * χ²(1 dof) critical value for p < 0.001. Phrases with
 * G² > this are treated as significant drift.
 * @type {number}
 */
export const DEFAULT_LLR_THRESHOLD = 10.83;

/**
 * Dunning's G² log-likelihood ratio contribution. Returns 0 for
 * observed === 0 by the 0·log(0) = 0 convention.
 * @param {number} observed
 * @param {number} expected
 * @returns {number}
 */
function termOr0(observed, expected) {
  if (observed === 0) return 0;
  return observed * Math.log(observed / expected);
}

/**
 * Compute the log-likelihood ratio comparing a current-window
 * phrase-count distribution against a baseline distribution.
 * Identifies phrases statistically over- or under-represented.
 *
 * @param {Record<string, number>} currentCounts
 * @param {Record<string, number>} baselineCounts
 * @param {{ threshold?: number, topN?: number }} [options]
 * @returns {{ added: string[], rising: string[], fading: string[] }}
 */
export function computeDrift(currentCounts, baselineCounts, options = {}) {
  const threshold = options.threshold ?? DEFAULT_LLR_THRESHOLD;
  const topN = options.topN ?? Infinity;

  const current = currentCounts && typeof currentCounts === 'object' ? currentCounts : {};
  const baseline = baselineCounts && typeof baselineCounts === 'object' ? baselineCounts : {};

  const currentPhrases = Object.keys(current);
  const baselinePhrases = Object.keys(baseline);

  // Empty current → nothing meaningful to contrast; emit all-empty.
  if (currentPhrases.length === 0) {
    return { added: [], rising: [], fading: [] };
  }
  // Empty baseline → every current phrase is "added"; no rising/fading possible.
  if (baselinePhrases.length === 0) {
    const added = currentPhrases
      .slice()
      .sort((a, b) => current[b] - current[a])
      .slice(0, topN);
    return { added, rising: [], fading: [] };
  }

  const totalCurrent = sumValues(current);
  const totalBaseline = sumValues(baseline);
  const N = totalCurrent + totalBaseline;
  if (N === 0) return { added: [], rising: [], fading: [] };

  /** @type {Array<{ phrase: string, a: number }>} */
  const added = [];
  /** @type {Array<{ phrase: string, g2: number }>} */
  const rising = [];
  /** @type {Array<{ phrase: string, g2: number }>} */
  const fading = [];

  const phraseSet = new Set([...currentPhrases, ...baselinePhrases]);

  for (const phrase of phraseSet) {
    const a = current[phrase] || 0;
    const c = baseline[phrase] || 0;

    if (c === 0 && a > 0) {
      added.push({ phrase, a });
      continue;
    }
    if (a === 0 && c > 0) {
      // Pure disappearance — covered under fading if G² ≥ threshold.
    }

    const b = totalCurrent - a;
    const d = totalBaseline - c;
    const totalPhrase = a + c;
    const totalOther = b + d;

    const eA = (totalCurrent * totalPhrase) / N;
    const eB = (totalCurrent * totalOther) / N;
    const eC = (totalBaseline * totalPhrase) / N;
    const eD = (totalBaseline * totalOther) / N;

    const g2 =
      2 * (termOr0(a, eA) + termOr0(b, eB) + termOr0(c, eC) + termOr0(d, eD));

    if (!Number.isFinite(g2) || g2 <= threshold) continue;

    if (a > eA) rising.push({ phrase, g2 });
    else if (a < eA) fading.push({ phrase, g2 });
  }

  added.sort((x, y) => y.a - x.a);
  rising.sort((x, y) => y.g2 - x.g2);
  fading.sort((x, y) => y.g2 - x.g2);

  return {
    added: added.slice(0, topN).map((x) => x.phrase),
    rising: rising.slice(0, topN).map((x) => x.phrase),
    fading: fading.slice(0, topN).map((x) => x.phrase),
  };
}

/**
 * Sum of numeric values in a record. Non-finite values are coerced to 0.
 * @param {Record<string, number>} record
 * @returns {number}
 */
function sumValues(record) {
  let total = 0;
  for (const v of Object.values(record)) {
    if (Number.isFinite(v)) total += v;
  }
  return total;
}
