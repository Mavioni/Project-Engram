// ─────────────────────────────────────────────────────────────
// Self Mirror — repository (encrypted IO orchestration).
// ─────────────────────────────────────────────────────────────
// Only module that talks to both crypto.js and db.js. Enforces:
//  - never persist plaintext (tokens, counts, derived signals)
//  - never place an index on a payload field
//  - stamp every write with schemaVersion + keyVersion
//  - on read, re-derive AAD from envelope fields before decrypt
//
// Drift baseline pairing (ADR §6):
//  recent-30d ← baseline = mid-90d
//  mid-90d    ← baseline = long-all
//  long-all   ← no baseline, drift stays empty
// ─────────────────────────────────────────────────────────────

import { subDays, parseISO, format } from 'date-fns';
import { encryptPayload, decryptPayload } from './crypto.js';
import { putEntry, getEntriesInDayRange, putSnapshot, getSnapshot } from './db.js';
import { SCHEMA_VERSION, KEY_VERSION_INITIAL, WINDOW_IDS } from '../model/schema.js';
import { aggregateWindow } from '../analysis/aggregate.js';
import { computeDrift } from '../analysis/drift.js';

/** @typedef {import('../model/schema.js').MirrorSnapshotPayload} SnapshotPayload */

const DEFAULT_SOURCE_KIND = 'journal';
const LONG_WINDOW_FROM_DAY = '0000-01-01';
const DAY_FORMAT = 'yyyy-MM-dd';

/**
 * Compose a MirrorEntryEnvelope from a plain payload and encrypt it.
 * ID: `plainEntry.id` or `crypto.randomUUID()`. createdDay:
 * `plainEntry.createdAt.slice(0, 10)`. AAD fields:
 * `{ id, createdDay, sourceKind, keyVersion, schemaVersion }`.
 *
 * @param {{createdAt: string, mood?: number, text: string, tags?: string[],
 *   id?: string, sourceKind?: 'journal'|'checkin'|'iris-note'|'manual'}} plainEntry
 * @param {CryptoKey} key
 * @returns {Promise<string>} the entry id
 */
export async function saveEntry(plainEntry, key) {
  if (!plainEntry || typeof plainEntry !== 'object') {
    throw new TypeError('saveEntry: plainEntry must be an object');
  }
  if (typeof plainEntry.createdAt !== 'string' || plainEntry.createdAt.length === 0) {
    throw new TypeError('saveEntry: plainEntry.createdAt is required');
  }
  if (typeof plainEntry.text !== 'string') {
    throw new TypeError('saveEntry: plainEntry.text must be a string');
  }
  const id = plainEntry.id || globalThis.crypto.randomUUID();
  const createdDay = plainEntry.createdAt.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(createdDay)) {
    throw new RangeError(
      'saveEntry: plainEntry.createdAt must be an ISO timestamp (YYYY-MM-DD prefix)',
    );
  }
  const sourceKind = plainEntry.sourceKind || DEFAULT_SOURCE_KIND;
  const aadFields = stripUndefined({
    id,
    createdDay,
    sourceKind,
    keyVersion: KEY_VERSION_INITIAL,
    schemaVersion: SCHEMA_VERSION,
  });
  const payload = {
    createdAt: plainEntry.createdAt,
    mood: plainEntry.mood,
    text: plainEntry.text,
    tags: plainEntry.tags,
  };
  const { ciphertext, iv } = await encryptPayload(key, payload, aadFields);
  await putEntry({ ...aadFields, ciphertext, iv });
  return id;
}

/**
 * Load + decrypt entries whose createdDay ∈ [fromDay, toDay].
 * Envelopes with `keyVersion !== KEY_VERSION_INITIAL` are skipped —
 * v1 has no rotation, so a mismatch is an integrity red flag.
 *
 * @param {string} fromDay  ISO YYYY-MM-DD, inclusive.
 * @param {string} toDay    ISO YYYY-MM-DD, inclusive.
 * @param {CryptoKey} key
 * @returns {Promise<Array<{ id: string, createdDay: string, sourceKind: string,
 *   createdAt: string, text: string, mood?: number, tags?: string[] }>>}
 */
export async function loadEntriesInRange(fromDay, toDay, key) {
  const envelopes = await getEntriesInDayRange(fromDay, toDay);
  const out = [];
  for (const env of envelopes) {
    if (env.keyVersion !== KEY_VERSION_INITIAL) continue;
    const aadFields = stripUndefined({
      id: env.id,
      createdDay: env.createdDay,
      sourceKind: env.sourceKind,
      keyVersion: env.keyVersion,
      schemaVersion: env.schemaVersion,
    });
    const payload = await decryptPayload(key, env.ciphertext, env.iv, aadFields);
    out.push({ id: env.id, createdDay: env.createdDay, sourceKind: env.sourceKind, ...payload });
  }
  return out;
}

/**
 * Rebuild all three per-window snapshots from the entire entry store.
 * Per window: filter by date range → aggregateWindow → compose drift
 * (recent→mid, mid→long, long→none) → encrypt under snapshot AAD
 * `{ id, updatedAt, keyVersion, schemaVersion }` → putSnapshot.
 *
 * @param {CryptoKey} key
 * @param {string} nowIsoString  ISO-8601 — treated as "now".
 * @returns {Promise<{ recent: SnapshotPayload, mid: SnapshotPayload, long: SnapshotPayload }>}
 */
export async function rebuildAllSnapshots(key, nowIsoString) {
  const { recent, mid, long } = currentWindowRanges(nowIsoString);
  const recentEntries = await loadEntriesInRange(recent.from, recent.to, key);
  const midEntries = await loadEntriesInRange(mid.from, mid.to, key);
  const longEntries = await loadEntriesInRange(long.from, long.to, key);

  const recentSnap = aggregateWindow(recentEntries, WINDOW_IDS.RECENT);
  const midSnap = aggregateWindow(midEntries, WINDOW_IDS.MID);
  const longSnap = aggregateWindow(longEntries, WINDOW_IDS.LONG);

  recentSnap.drift = computeDrift(recentSnap.phraseCounts, midSnap.phraseCounts);
  midSnap.drift = computeDrift(midSnap.phraseCounts, longSnap.phraseCounts);
  // Long has no baseline; aggregateWindow already emitted empty arrays.

  const updatedAt = Date.now();
  await persistSnapshot(key, WINDOW_IDS.RECENT, recentSnap, updatedAt);
  await persistSnapshot(key, WINDOW_IDS.MID, midSnap, updatedAt);
  await persistSnapshot(key, WINDOW_IDS.LONG, longSnap, updatedAt);
  return { recent: recentSnap, mid: midSnap, long: longSnap };
}

/**
 * Incremental update after a single saveEntry. v1 is intentionally
 * lazy — recent→mid and mid→long drift pairs cascade, so a new
 * recent-window entry may influence all three snapshots. We delegate
 * to `rebuildAllSnapshots`: correct, O(total entries), fine while
 * snapshots stay small. Phase 1.1 may add targeted invalidation.
 *
 * @param {string} _entryId  Unused in v1; reserved for Phase 1.1.
 * @param {CryptoKey} key
 * @param {string} nowIsoString
 * @returns {ReturnType<typeof rebuildAllSnapshots>}
 */
export async function touchSnapshotsForEntry(_entryId, key, nowIsoString) {
  return rebuildAllSnapshots(key, nowIsoString);
}

/**
 * Load + decrypt the snapshot for a window. Returns `null` if absent.
 * Throws on keyVersion mismatch (integrity red flag).
 *
 * @param {'recent-30d' | 'mid-90d' | 'long-all'} windowId
 * @param {CryptoKey} key
 * @returns {Promise<SnapshotPayload | null>}
 */
export async function loadSnapshot(windowId, key) {
  const env = await getSnapshot(windowId);
  if (!env) return null;
  if (env.keyVersion !== KEY_VERSION_INITIAL) {
    throw new Error(
      `loadSnapshot: keyVersion mismatch for ${windowId} (expected ${KEY_VERSION_INITIAL}, got ${env.keyVersion})`,
    );
  }
  const aadFields = stripUndefined({
    id: env.id,
    updatedAt: env.updatedAt,
    keyVersion: env.keyVersion,
    schemaVersion: env.schemaVersion,
  });
  return /** @type {SnapshotPayload} */ (
    await decryptPayload(key, env.ciphertext, env.iv, aadFields)
  );
}

// ─── internal helpers ──────────────────────────────────────

/**
 * Encrypt + persist one snapshot window under the snapshot AAD.
 * @param {CryptoKey} key
 * @param {'recent-30d' | 'mid-90d' | 'long-all'} windowId
 * @param {SnapshotPayload} payload
 * @param {number} updatedAt
 */
async function persistSnapshot(key, windowId, payload, updatedAt) {
  const aadFields = {
    id: windowId,
    updatedAt,
    keyVersion: KEY_VERSION_INITIAL,
    schemaVersion: SCHEMA_VERSION,
  };
  const { ciphertext, iv } = await encryptPayload(key, payload, aadFields);
  await putSnapshot({ ...aadFields, ciphertext, iv });
}

/**
 * Per-window `from`/`to` day strings. `long-all` uses
 * `LONG_WINDOW_FROM_DAY` (lex-less-than any realistic ISO day).
 * @param {string} nowIsoString
 */
function currentWindowRanges(nowIsoString) {
  const now = parseISO(nowIsoString);
  if (Number.isNaN(now.getTime())) {
    throw new RangeError(`rebuildAllSnapshots: invalid nowIsoString: ${nowIsoString}`);
  }
  const to = format(now, DAY_FORMAT);
  return {
    recent: { from: format(subDays(now, 30), DAY_FORMAT), to },
    mid: { from: format(subDays(now, 90), DAY_FORMAT), to },
    long: { from: LONG_WINDOW_FROM_DAY, to },
  };
}

/**
 * Remove `undefined`-valued keys (ADR §12.2 guard — an accidental
 * `undefined` field is silently elided by JSON.stringify, which
 * would invalidate AAD on the read side).
 * @template {Record<string, unknown>} T
 * @param {T} fields
 * @returns {T}
 */
function stripUndefined(fields) {
  const out = /** @type {T} */ ({});
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) out[k] = v;
  return out;
}
