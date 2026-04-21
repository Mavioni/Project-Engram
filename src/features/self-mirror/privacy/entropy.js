// ─────────────────────────────────────────────────────────────
// Self Mirror — passphrase entropy scorer.
// ─────────────────────────────────────────────────────────────
// Hand-rolled Shannon-style approximation per ADR §12.1. We compute
// `length * log2(charset_size)` where `charset_size` is the union of
// the character classes present. This over-estimates dictionary
// passphrases — a deliberate pragmatic ceiling. Real zxcvbn is a
// Phase 1.1 upgrade once bundle budget is measured (~400 KB).
//
// Thresholds (bits → score):
//   <28 → 0 (very weak), <36 → 1 (weak), <60 → 2 (fair),
//   <128 → 3 (strong), ≥128 → 4 (very strong).
// ─────────────────────────────────────────────────────────────

/** Threshold for unlock form — matches ADR §12.1 default. */
export const MIN_ENTROPY_SCORE = 3;

// Charset cardinalities. "other" (non-ASCII) is generous at 1000
// to avoid punishing legitimate unicode passphrases.
const SIZE_LOWER = 26;
const SIZE_UPPER = 26;
const SIZE_DIGIT = 10;
const SIZE_SYMBOL = 32;
const SIZE_OTHER = 1000;

const RE_LOWER = /[a-z]/;
const RE_UPPER = /[A-Z]/;
const RE_DIGIT = /\d/;
const RE_SYMBOL = /[!-/:-@[-`{-~]/;

const LABELS = Object.freeze([
  'very weak',
  'weak',
  'fair',
  'strong',
  'very strong',
]);

/**
 * Estimate passphrase strength. Integer score in [0, 4]. Pure.
 *
 * @param {string} passphrase
 * @returns {number}
 */
export function scoreEntropy(passphrase) {
  if (typeof passphrase !== 'string' || passphrase.length === 0) return 0;

  let charset = 0;
  if (RE_LOWER.test(passphrase)) charset += SIZE_LOWER;
  if (RE_UPPER.test(passphrase)) charset += SIZE_UPPER;
  if (RE_DIGIT.test(passphrase)) charset += SIZE_DIGIT;
  if (RE_SYMBOL.test(passphrase)) charset += SIZE_SYMBOL;
  for (let i = 0; i < passphrase.length; i += 1) {
    if (passphrase.charCodeAt(i) > 127) {
      charset += SIZE_OTHER;
      break;
    }
  }
  if (charset === 0) return 0;

  const bits = passphrase.length * Math.log2(charset);
  if (bits >= 128) return 4;
  if (bits >= 60) return 3;
  if (bits >= 36) return 2;
  if (bits >= 28) return 1;
  return 0;
}

/**
 * Human label for a score. Used in the unlock-form strength hint.
 *
 * @param {number} score
 * @returns {'very weak'|'weak'|'fair'|'strong'|'very strong'}
 */
export function entropyLabel(score) {
  const idx = Math.max(0, Math.min(LABELS.length - 1, Math.trunc(score)));
  return /** @type {typeof LABELS[number]} */ (LABELS[idx]);
}
