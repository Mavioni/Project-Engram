// ─────────────────────────────────────────────────────────────
// Self Mirror — envelope/payload schema + shared constants.
// ─────────────────────────────────────────────────────────────
// The envelope is operational metadata (indexable, never sensitive).
// The payload is the encrypted, plaintext-when-decrypted body. See
// docs/decisions/2026-04-17-self-mirror-architecture.md §3 / §5.
// Types are JSDoc-only — the repo is .jsx/.js, not TypeScript.
// ─────────────────────────────────────────────────────────────

export const SCHEMA_VERSION = 1;
export const KEY_VERSION_INITIAL = 1;

/**
 * Default KDF + AEAD parameters. Persisted into `mirror_meta` at first
 * unlock so future algorithm rotations are data-migrations rather than
 * hard forks. 600k iterations is the OWASP 2024 PBKDF2-HMAC-SHA-256
 * floor and will be benchmarked against the operator's actual hardware
 * before shipping (see ADR §Follow-ups).
 */
export const DEFAULT_KDF_PARAMS = Object.freeze({
  kdf: 'PBKDF2',
  hash: 'SHA-256',
  iterations: 600000,
  aes: 'AES-GCM',
  keyLength: 256,
});

/**
 * Canonical ids for the three retention windows surfaced by the UI.
 * Stored directly as snapshot envelope `id` — there is exactly one
 * snapshot envelope per window at any time.
 */
export const WINDOW_IDS = Object.freeze({
  RECENT: 'recent-30d',
  MID: 'mid-90d',
  LONG: 'long-all',
});

/**
 * Accepted sources an entry can originate from. Envelope-level so it is
 * cheap to filter/index on without decryption.
 */
export const SOURCE_KINDS = Object.freeze([
  'journal',
  'checkin',
  'iris-note',
  'manual',
]);

/**
 * @typedef {'recent-30d' | 'mid-90d' | 'long-all'} WindowId
 */

/**
 * @typedef {'journal' | 'checkin' | 'iris-note' | 'manual'} SourceKind
 */

/**
 * @typedef {Object} MirrorEntryEnvelope
 * @property {string} id                 Stable record id (uuid v4).
 * @property {number} keyVersion         Monotonic — bumps on passphrase rotation.
 * @property {number} schemaVersion      Equal to SCHEMA_VERSION at write time.
 * @property {string} createdDay         ISO YYYY-MM-DD of createdAt, operator's tz.
 * @property {SourceKind} sourceKind     Provenance — envelope-safe.
 * @property {ArrayBuffer} ciphertext    AES-GCM ciphertext + tag (tag-appended).
 * @property {ArrayBuffer} iv            12-byte IV, unique per record.
 */

/**
 * @typedef {Object} MirrorEntryPayload
 * @property {string} createdAt          ISO timestamp of capture.
 * @property {number=} mood              Optional normalized mood in [0,1].
 * @property {string} text               Plaintext entry body (never persisted).
 * @property {string[]=} tags            Optional operator-applied tags.
 */

/**
 * @typedef {Object} MirrorSnapshotEnvelope
 * @property {WindowId} id
 * @property {number} keyVersion
 * @property {number} schemaVersion
 * @property {number} updatedAt          Unix ms of last rebuild.
 * @property {ArrayBuffer} ciphertext
 * @property {ArrayBuffer} iv
 */

/**
 * @typedef {Object} PhraseCount
 * @property {string} phrase
 * @property {number} count
 */

/**
 * @typedef {Object} ThemeScore
 * @property {string} theme
 * @property {number} score              Normalized in [0,1].
 */

/**
 * @typedef {Object} MoodLanguagePair
 * @property {string} token              Normalized unigram or phrase.
 * @property {number} mood               Average mood observed with this token.
 * @property {number} n                  Occurrence count.
 */

/**
 * @typedef {Object} DriftBuckets
 * @property {string[]} added            Newly-appearing terms this window.
 * @property {string[]} rising           Significantly more frequent vs baseline.
 * @property {string[]} fading           Significantly less frequent vs baseline.
 */

/**
 * @typedef {Object} MirrorSnapshotPayload
 * @property {WindowId} window
 * @property {PhraseCount[]} phraseCounts
 * @property {ThemeScore[]} themeScores
 * @property {MoodLanguagePair[]} moodLanguage
 * @property {DriftBuckets} drift
 */

/**
 * @typedef {Object} MirrorMetaRecord
 * @property {string} id                 e.g. 'kdf' | 'keyVersion' | 'salt'.
 * @property {unknown} value
 */
