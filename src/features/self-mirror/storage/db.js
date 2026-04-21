// ─────────────────────────────────────────────────────────────
// Self Mirror — Dexie schema + CRUD singleton.
// ─────────────────────────────────────────────────────────────
// Three object stores, each indexed *only* on envelope fields. No
// keyPath ever points into the encrypted payload (doctrine invariant,
// ADR §11).
//
//   mirror_entries
//     &id                  primary, uuid
//     createdDay           for window filters (ISO YYYY-MM-DD, lex-sortable)
//     sourceKind           filter by provenance
//     keyVersion           rotation sweeps
//
//   mirror_snapshots
//     &id                  'recent-30d' | 'mid-90d' | 'long-all'
//     updatedAt            age ordering
//     keyVersion           rotation sweeps
//
//   mirror_meta
//     &id                  'kdf-params' | 'key-epoch' | 'schema-version' | ...
//     updatedAt
// ─────────────────────────────────────────────────────────────

import Dexie from 'dexie';

const DB_NAME = 'engram-self-mirror-v1';
const DB_VERSION = 1;

/** @type {Dexie | null} */
let _db = null;

/**
 * Lazy singleton Dexie instance. First call opens the database;
 * subsequent calls return the same instance. Tests call {@link resetDb}
 * between cases so `fake-indexeddb` state does not leak.
 *
 * Throws a clear error if `indexedDB` is unavailable — we refuse to
 * silently degrade because this feature's entire value proposition is
 * local encrypted storage.
 *
 * @returns {Dexie}
 */
export function getDb() {
  if (_db) return _db;
  if (typeof globalThis.indexedDB === 'undefined') {
    throw new Error(
      'self-mirror/db: indexedDB is unavailable in this environment',
    );
  }
  const db = new Dexie(DB_NAME);
  db.version(DB_VERSION).stores({
    mirror_entries: '&id, createdDay, sourceKind, keyVersion',
    mirror_snapshots: '&id, updatedAt, keyVersion',
    mirror_meta: '&id, updatedAt',
  });
  _db = db;
  return db;
}

/**
 * Close + drop the singleton. Paired with `Dexie.delete(DB_NAME)` so
 * the next `getDb()` call re-opens a fresh instance. Test-only —
 * production never deletes the DB without an explicit operator
 * action.
 *
 * @returns {Promise<void>}
 */
export async function resetDb() {
  if (_db) {
    try {
      _db.close();
    } catch {
      // Dexie may throw on already-closed instances; nothing to log.
    }
    _db = null;
  }
  await Dexie.delete(DB_NAME);
}

/**
 * Persist a MirrorEntryEnvelope. Caller provides the fully-formed
 * envelope (see model/schema.js). Returns the id.
 *
 * @param {import('../model/schema.js').MirrorEntryEnvelope} envelope
 * @returns {Promise<string>}
 */
export async function putEntry(envelope) {
  const db = getDb();
  await db.table('mirror_entries').put(envelope);
  return envelope.id;
}

/**
 * Load a MirrorEntryEnvelope by id.
 *
 * @param {string} id
 * @returns {Promise<import('../model/schema.js').MirrorEntryEnvelope | undefined>}
 */
export async function getEntry(id) {
  const db = getDb();
  return db.table('mirror_entries').get(id);
}

/**
 * Delete a MirrorEntryEnvelope by id. Silent no-op if the row is
 * absent — Dexie's .delete() returns undefined in that case.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteEntry(id) {
  const db = getDb();
  await db.table('mirror_entries').delete(id);
}

/**
 * Range query by createdDay. Both endpoints inclusive. YYYY-MM-DD
 * strings are lex-sortable, so Dexie's `between(from, to, true, true)`
 * (both-inclusive) is the right primitive.
 *
 * @param {string} fromDay   ISO YYYY-MM-DD, inclusive.
 * @param {string} toDay     ISO YYYY-MM-DD, inclusive.
 * @returns {Promise<import('../model/schema.js').MirrorEntryEnvelope[]>}
 */
export async function getEntriesInDayRange(fromDay, toDay) {
  const db = getDb();
  return db
    .table('mirror_entries')
    .where('createdDay')
    .between(fromDay, toDay, true, true)
    .toArray();
}

/**
 * Persist a MirrorSnapshotEnvelope (one of `recent-30d`, `mid-90d`,
 * `long-all`).
 *
 * @param {import('../model/schema.js').MirrorSnapshotEnvelope} envelope
 * @returns {Promise<string>}
 */
export async function putSnapshot(envelope) {
  const db = getDb();
  await db.table('mirror_snapshots').put(envelope);
  return envelope.id;
}

/**
 * Load a MirrorSnapshotEnvelope by window id.
 *
 * @param {string} id
 * @returns {Promise<import('../model/schema.js').MirrorSnapshotEnvelope | undefined>}
 */
export async function getSnapshot(id) {
  const db = getDb();
  return db.table('mirror_snapshots').get(id);
}

/**
 * Persist a meta record (KDF params, key epoch, schema version, etc.).
 * Not encrypted — these are operational parameters, not content
 * (ADR §12.3).
 *
 * @param {import('../model/schema.js').MirrorMetaRecord & { updatedAt: string }} record
 * @returns {Promise<string>}
 */
export async function putMeta(record) {
  const db = getDb();
  await db.table('mirror_meta').put(record);
  return record.id;
}

/**
 * Load a meta record by id.
 *
 * @param {string} id
 * @returns {Promise<(import('../model/schema.js').MirrorMetaRecord & { updatedAt: string }) | undefined>}
 */
export async function getMeta(id) {
  const db = getDb();
  return db.table('mirror_meta').get(id);
}

export const DB_META = Object.freeze({
  name: DB_NAME,
  version: DB_VERSION,
});
