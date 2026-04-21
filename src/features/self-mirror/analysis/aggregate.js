// ─────────────────────────────────────────────────────────────
// Self Mirror — window aggregation.
// ─────────────────────────────────────────────────────────────
// Takes a set of decrypted entries and produces a snapshot payload
// for one retention window. Uses balancedTernary from src/lib/ternary
// to bucket theme scores into -1 / 0 / +1 (below / neutral / above).
//
// Invariants:
//   - No storage or crypto calls. Pure in-memory transform.
//   - Drift buckets are emitted empty — the repository layer calls
//     computeDrift against a baseline after aggregation and patches
//     the `drift` field before persisting.
//   - Trigrams are deliberately skipped in v1 to halve snapshot
//     storage; revisit when UI demands longer phrases.
//
// Shape note (judgment call for ADR §3 refinement):
//   phraseCounts : Record<phrase, count>
//   themeScores  : Record<phrase, { score: number, classification: -1|0|1 }>
//   moodLanguage : Record<mood, Record<phrase, count>>
// This differs from the scaffold typedefs (which used arrays of
// `{phrase, count}` objects). Map form matches the contract in the
// anbu-code brief and is faster to merge incrementally from
// repository.js on every save. Flagged in the return report.
// ─────────────────────────────────────────────────────────────

import { balancedTernary } from '../../../lib/ternary.js';
import { tokenize, bigrams } from './tokenize.js';

/** Max phrases carried into themeScores. Keeps snapshot sizes bounded. */
const THEME_TOP_N = 20;

/**
 * Fold a collection of decrypted entries into a single snapshot
 * payload for the given retention window.
 *
 * Empty `entries` returns a fully-formed payload with empty maps —
 * never throws.
 *
 * @param {Array<{createdAt:string, mood?:string, text:string, tags?:string[]}>} entries
 * @param {'recent-30d' | 'mid-90d' | 'long-all'} windowId
 * @returns {{
 *   window: string,
 *   phraseCounts: Record<string, number>,
 *   themeScores: Record<string, { score: number, classification: -1|0|1 }>,
 *   moodLanguage: Record<string, Record<string, number>>,
 *   drift: { added: string[], rising: string[], fading: string[] }
 * }}
 */
export function aggregateWindow(entries, windowId) {
  /** @type {Record<string, number>} */
  const phraseCounts = Object.create(null);
  /** @type {Record<string, Record<string, number>>} */
  const moodLanguage = Object.create(null);

  const safeEntries = Array.isArray(entries) ? entries : [];
  for (const entry of safeEntries) {
    if (!entry || typeof entry.text !== 'string') continue;

    const tokens = tokenize(entry.text);
    if (tokens.length === 0) continue;

    const phrases = [...tokens, ...bigrams(tokens)];

    for (const phrase of phrases) {
      phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
    }

    if (typeof entry.mood === 'string' && entry.mood.length > 0) {
      let moodBucket = moodLanguage[entry.mood];
      if (!moodBucket) {
        moodBucket = Object.create(null);
        moodLanguage[entry.mood] = moodBucket;
      }
      for (const token of tokens) {
        moodBucket[token] = (moodBucket[token] || 0) + 1;
      }
    }
  }

  const themeScores = computeThemeScores(phraseCounts);

  return {
    window: windowId,
    phraseCounts,
    themeScores,
    moodLanguage,
    drift: { added: [], rising: [], fading: [] },
  };
}

/**
 * Top-N phrases by raw count, each tagged with a balanced-ternary
 * classification over the normalised range of scores within the set.
 *
 * Normalisation: score ∈ [0, 1] = (count - min) / (max - min). When
 * max === min we pin every normalised score at 0 so ternaryIndex
 * collapses to the middle bucket (0 via balancedTernary).
 *
 * @param {Record<string, number>} phraseCounts
 * @returns {Record<string, { score: number, classification: -1|0|1 }>}
 */
function computeThemeScores(phraseCounts) {
  /** @type {Record<string, { score: number, classification: -1|0|1 }>} */
  const out = Object.create(null);

  const entries = Object.entries(phraseCounts);
  if (entries.length === 0) return out;

  entries.sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, THEME_TOP_N);

  const counts = top.map(([, c]) => c);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const span = max - min;

  for (const [phrase, count] of top) {
    const normalised = span === 0 ? 0 : (count - min) / span;
    out[phrase] = {
      score: count,
      classification: /** @type {-1|0|1} */ (balancedTernary(normalised)),
    };
  }

  return out;
}
