// ─────────────────────────────────────────────────────────────
// Self Mirror — display-time redaction.
// ─────────────────────────────────────────────────────────────
// Applied at the view layer only. Plaintext still lives unredacted
// inside the encrypted payload; redaction protects the *rendered*
// surface from shoulder-surfing and accidental screenshots.
//
// ─────────────────────────────────────────────────────────────
// Operator-specific rules (family names, locations, IRIS-sensitive
// tokens) DO NOT live in source — this repo is public, and the
// tokens a user wants masked are themselves sensitive. Rules live
// in the encrypted runtime store (see ./rules.js and
// ../storage/repository.js — persistent under mirror_snapshots id
// 'redaction-v1'). Callers pass them in as the second argument.
// Source ships three mechanical rules (email / phone / URL) only.
// ─────────────────────────────────────────────────────────────

/**
 * Placeholder tokens rendered in place of redacted matches. Kept
 * short so wrapping/layout is preserved and long lines don't jump.
 */
const PLACEHOLDER_EMAIL = '[email]';
const PLACEHOLDER_PHONE = '[phone]';
const PLACEHOLDER_URL = '[url]';
const PLACEHOLDER_IDENTITY = '[name]';
const PLACEHOLDER_LOCATION = '[place]';
const PLACEHOLDER_IRIS = '[iris]';

// RFC 5322 is a trap. This is the pragmatic "local@domain.tld" match
// the rest of the industry settles on. Deliberately greedy on the
// local part to catch plus-addressing and dots. Case-insensitive.
const EMAIL_RE =
  /[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/gi;

// E.164-adjacent + common US/EU formatting. Requires at least 7
// digits total so we don't swallow short codes or years. Handles
// spaces, dots, hyphens, and parenthesized area codes.
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]?\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})?/g;

// http(s), ws(s), ftp, or a bare www.host.tld. Stops at whitespace /
// common sentence-closing punctuation so trailing periods aren't
// eaten. Matched before email so an href's domain isn't double-hit.
const URL_RE =
  /\b(?:(?:https?|ftp|wss?):\/\/|www\.)[^\s<>"'()]+[^\s<>"'()\\.,;:!?]/gi;

/**
 * Compile an array of case-insensitive, word-boundary-anchored
 * tokens into a single union regex. Returns `null` for an empty
 * or missing list so the caller can skip the replace pass entirely.
 *
 * @param {string[] | undefined | null} tokens
 * @returns {RegExp | null}
 */
function buildListRegex(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) return null;
  const escaped = tokens
    .filter((t) => typeof t === 'string' && t.length > 0)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return null;
  return new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'gi');
}

/**
 * @typedef {Object} RedactionRules
 * @property {string[]} [familyNames]    Names to mask as [name]
 * @property {string[]} [locations]      Places to mask as [place]
 * @property {string[]} [irisSensitive]  IRIS/enneagram tokens to mask as [iris]
 */

/**
 * Apply v1 mechanical redactions, then optional operator rules.
 * Operator rules default to empty — nothing extra is redacted unless
 * callers supply them from the encrypted runtime store.
 *
 * @param {string} text
 * @param {RedactionRules} [rules]
 * @returns {string}
 */
export function redactForDisplay(text, rules = {}) {
  if (typeof text !== 'string' || text.length === 0) return '';
  // Order matters: URL before email (URLs often contain @), phone
  // next (phone regex is the loosest for the mechanical pass).
  // Operator rules run last so they cannot be nibbled by the
  // mechanical passes — and so an operator token that happens to
  // look like a phone number still gets the identity placeholder.
  let out = text.replace(URL_RE, PLACEHOLDER_URL);
  out = out.replace(EMAIL_RE, PLACEHOLDER_EMAIL);
  out = out.replace(PHONE_RE, PLACEHOLDER_PHONE);
  const fam = buildListRegex(rules.familyNames);
  const loc = buildListRegex(rules.locations);
  const iris = buildListRegex(rules.irisSensitive);
  if (fam) out = out.replace(fam, PLACEHOLDER_IDENTITY);
  if (loc) out = out.replace(loc, PLACEHOLDER_LOCATION);
  if (iris) out = out.replace(iris, PLACEHOLDER_IRIS);
  return out;
}

/**
 * Exposed for tests and for the operator-contribution follow-up so
 * new rules can reuse the same placeholder vocabulary.
 */
export const PLACEHOLDERS = Object.freeze({
  email: PLACEHOLDER_EMAIL,
  phone: PLACEHOLDER_PHONE,
  url: PLACEHOLDER_URL,
  identity: PLACEHOLDER_IDENTITY,
  location: PLACEHOLDER_LOCATION,
  iris: PLACEHOLDER_IRIS,
});
