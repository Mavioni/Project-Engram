// ─────────────────────────────────────────────────────────────
// Self Mirror — tokenization.
// ─────────────────────────────────────────────────────────────
// Normalization + stopword filtering + phrase windowing. All of
// this runs on *decrypted* text in memory only — output is fed
// into aggregate.js, which writes back only inside an encrypted
// snapshot payload.
//
// Pipeline per `tokenize`:
//   1. NFKC-normalise + lowercase.
//   2. Strip unicode punctuation and symbols EXCEPT the ASCII
//      apostrophe (preserves intra-word `don't`).
//   3. Split on whitespace.
//   4. Strip leading/trailing apostrophes from each token.
//   5. Drop empty tokens, stopwords, and single-character tokens.
//
// Stopword list is a curated set of common English function words,
// inlined to avoid a library dependency (ADR §11 forbids LLM SDK
// imports in this feature tree; we hold the line on zero-dep too).
// ─────────────────────────────────────────────────────────────

/**
 * Curated English stopwords. Not exhaustive — tuned to kill the
 * highest-frequency noise without cratering low-frequency signal.
 * @type {ReadonlySet<string>}
 */
const STOPWORDS = new Set([
  'a', 'an', 'the',
  'and', 'or', 'but', 'nor', 'so', 'yet', 'for',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'doing',
  'have', 'has', 'had', 'having',
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its',
  'we', 'us', 'our', 'ours', 'they', 'them', 'their', 'theirs',
  'this', 'that', 'these', 'those',
  'of', 'in', 'on', 'at', 'to', 'from', 'by', 'with', 'as',
  'if', 'then', 'than', 'because', 'while',
  'not', 'no',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must',
]);

// `\p{P}` = punctuation, `\p{S}` = symbols. `u` flag enables
// unicode-property escapes. `g` so replaceAll semantics.
const PUNCT_OR_SYMBOL = /[\p{P}\p{S}]/gu;

/**
 * Lowercase, strip punctuation/symbols (preserving intra-word
 * apostrophes), split on whitespace, remove stopwords, drop
 * single-character tokens.
 *
 * @param {string} text
 * @returns {string[]} tokens
 */
export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];

  const normalised = trimmed.normalize('NFKC').toLowerCase();

  // Strip every punctuation/symbol except ASCII apostrophe (`'`).
  const stripped = normalised.replace(PUNCT_OR_SYMBOL, (ch) => (ch === "'" ? ch : ' '));

  const out = [];
  for (const raw of stripped.split(/\s+/)) {
    if (!raw) continue;
    // Strip leading/trailing apostrophes: `'hello'` → `hello`.
    const token = raw.replace(/^'+|'+$/g, '');
    if (token.length < 2) continue;
    if (STOPWORDS.has(token)) continue;
    out.push(token);
  }
  return out;
}

/**
 * Adjacent-pair sliding window over tokens. Returns tokens joined
 * by a single space.
 *
 * @param {string[]} tokens
 * @returns {string[]}
 */
export function bigrams(tokens) {
  if (!Array.isArray(tokens) || tokens.length < 2) return [];
  const out = new Array(tokens.length - 1);
  for (let i = 0; i < tokens.length - 1; i += 1) {
    out[i] = `${tokens[i]} ${tokens[i + 1]}`;
  }
  return out;
}

/**
 * Adjacent-triple sliding window over tokens.
 *
 * @param {string[]} tokens
 * @returns {string[]}
 */
export function trigrams(tokens) {
  if (!Array.isArray(tokens) || tokens.length < 3) return [];
  const out = new Array(tokens.length - 2);
  for (let i = 0; i < tokens.length - 2; i += 1) {
    out[i] = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
  }
  return out;
}
