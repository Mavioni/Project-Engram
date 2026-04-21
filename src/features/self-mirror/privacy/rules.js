// ─────────────────────────────────────────────────────────────
// Self Mirror — operator redaction rules (machinery only).
// ─────────────────────────────────────────────────────────────
// The rules themselves (family names, locations, IRIS-sensitive
// tokens) are PII. This repo is public. Therefore:
//
//   The source ships empty. Rules live in the encrypted runtime
//   store and are populated by the operator through the app, not
//   through git.
//
// Storage: a single encrypted record under mirror_snapshots with
// id 'redaction-v1'. The payload shape is RedactionRules (see
// redact.js). repository.js provides loadRedactionRules() /
// saveRedactionRules() that round-trip through the same AES-GCM
// envelope the self-mirror entries use.
//
// Lifecycle:
//   - On unlock: useSelfMirror reads the rules into memory and
//     threads them through redactForDisplay() for every rendered
//     phrase.
//   - On lock / tab close: zeroed along with the data key.
//   - Edit UI: Phase 1.1 follow-up (small panel on SelfMirrorPage).
//     Until then, bootstrap via the in-app console or an import
//     bundle from a trusted device.
// ─────────────────────────────────────────────────────────────

/**
 * The shape of the encrypted payload stored under
 * mirror_snapshots[id='redaction-v1'].
 *
 * @typedef {Object} RedactionRules
 * @property {string[]} familyNames
 * @property {string[]} locations
 * @property {string[]} irisSensitive
 */

/** The empty-ruleset default. Frozen so callers cannot mutate. */
export const EMPTY_RULES = Object.freeze({
  familyNames: Object.freeze([]),
  locations: Object.freeze([]),
  irisSensitive: Object.freeze([]),
});

/** Store key for the redaction rules snapshot record. */
export const REDACTION_SNAPSHOT_ID = 'redaction-v1';

/**
 * Validate a candidate RedactionRules object. Returns a normalised
 * copy with the expected shape (all three arrays present, all
 * entries strings, duplicates removed, whitespace trimmed). Throws
 * if the shape is wrong — this is called on import, where rejecting
 * bad data is safer than silently coercing.
 *
 * @param {unknown} candidate
 * @returns {RedactionRules}
 */
export function normaliseRules(candidate) {
  if (candidate === null || typeof candidate !== 'object') {
    throw new TypeError('RedactionRules must be an object');
  }
  const c = /** @type {Record<string, unknown>} */ (candidate);
  const keys = ['familyNames', 'locations', 'irisSensitive'];
  /** @type {Record<string, string[]>} */
  const out = { familyNames: [], locations: [], irisSensitive: [] };
  for (const k of keys) {
    const v = c[k];
    if (v === undefined) continue;
    if (!Array.isArray(v)) {
      throw new TypeError(`RedactionRules.${k} must be an array`);
    }
    const seen = new Set();
    for (const entry of v) {
      if (typeof entry !== 'string') {
        throw new TypeError(`RedactionRules.${k} entries must be strings`);
      }
      const trimmed = entry.trim();
      if (trimmed.length === 0) continue;
      const lower = trimmed.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      out[k].push(trimmed);
    }
  }
  return /** @type {RedactionRules} */ (out);
}
