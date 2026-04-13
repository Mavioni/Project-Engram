// ─────────────────────────────────────────────────────────────
// Ternary logic utilities
// ─────────────────────────────────────────────────────────────
// A ternary classifier maps a normalized value in [0,1] to one of
// three buckets: LOW, MID, HIGH. IRIS v3.2 originally inlined this
// as a chain of branches; this module is the formal, reusable,
// branchless version it was always trying to be.
//
// The trick: `value > threshold` coerces to 0 or 1, so the sum
// `(v > t1) + (v > t2)` yields exactly 0, 1, or 2 with no control
// flow — one predictable instruction sequence per call, ideal for
// tight loops like the per-facet rendering in the profile card.
// ─────────────────────────────────────────────────────────────

export const TERNARY_LOW = 0;
export const TERNARY_MID = 1;
export const TERNARY_HIGH = 2;

export const DEFAULT_THRESHOLDS = Object.freeze([0.35, 0.65]);

/**
 * Returns 0 | 1 | 2 for a value in [0,1].
 * Branchless — stable cost regardless of bucket.
 */
export function ternaryIndex(value, thresholds = DEFAULT_THRESHOLDS) {
  return (value > thresholds[0]) + (value > thresholds[1]);
}

/**
 * Pick one of three fields on an object by ternary bucket.
 * Used by IRIS to render facet interpretations:
 *   classifyTernary(facet, 0.7) === facet.high
 */
export function classifyTernary(obj, value, thresholds = DEFAULT_THRESHOLDS) {
  return [obj.low, obj.mid, obj.high][ternaryIndex(value, thresholds)];
}

/**
 * Symbolic label for a bucket. Useful for charts, debug output,
 * and the IRIS vector string.
 */
export function ternaryLabel(value, thresholds = DEFAULT_THRESHOLDS) {
  return ['low', 'mid', 'high'][ternaryIndex(value, thresholds)];
}

/**
 * Balanced ternary score: -1 | 0 | +1. Useful when you want the
 * bucket to carry sign information (shadow below baseline,
 * neutral, above baseline).
 */
export function balancedTernary(value, thresholds = DEFAULT_THRESHOLDS) {
  return ternaryIndex(value, thresholds) - 1;
}
