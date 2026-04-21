// ─────────────────────────────────────────────────────────────
// Self Mirror — encrypted export / import bundle (v1).
// ─────────────────────────────────────────────────────────────
// Bundle format v1 — JSON, one record type per array:
//   { schemaVersion: 1, bundleKind: 'self-mirror-v1', exportedAt,
//     kdfParams, entries[], snapshots[], meta[] }
// Envelopes replace `ciphertext`/`iv` Uint8Arrays with `ciphertextB64`
// / `ivB64` base64 strings; all other envelope fields survive verbatim.
// Import reverses the transform and decrypt-verifies each record to
// validate AAD round-trip (= wrong-key + tamper detection).
// ─────────────────────────────────────────────────────────────

import { getDb } from './db.js';
import { decryptPayload } from './crypto.js';

const BUNDLE_SCHEMA_VERSION = 1;
const BUNDLE_KIND = 'self-mirror-v1';

/**
 * Build an encrypted export bundle. `_key` is accepted for API
 * symmetry with {@link parseImportBundle}; unused here because every
 * record is already individually encrypted.
 *
 * @param {CryptoKey} _key
 * @returns {Promise<string>} JSON string of the bundle.
 */
export async function buildExportBundle(_key) {
  const db = getDb();
  const entryEnvelopes = await db.table('mirror_entries').toArray();
  const snapshotEnvelopes = await db.table('mirror_snapshots').toArray();
  const metaRecords = await db.table('mirror_meta').toArray();
  const kdfMeta = metaRecords.find((m) => m.id === 'kdf-params');
  return JSON.stringify({
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    bundleKind: BUNDLE_KIND,
    exportedAt: new Date().toISOString(),
    kdfParams: kdfMeta ? kdfMeta.value : null,
    entries: entryEnvelopes.map(envelopeToB64),
    snapshots: snapshotEnvelopes.map(envelopeToB64),
    meta: metaRecords,
  });
}

/**
 * Validate + import a bundle. Rejects wrong schemaVersion, wrong
 * bundleKind, and any envelope whose AAD + ciphertext fails to
 * round-trip decrypt under `key`. On success: merges by id
 * (Dexie `put` = last-writer-wins).
 *
 * @param {string} jsonString
 * @param {CryptoKey} key
 * @returns {Promise<{ entries: number, snapshots: number, meta: number }>}
 */
export async function parseImportBundle(jsonString, key) {
  if (typeof jsonString !== 'string' || jsonString.length === 0) {
    throw new TypeError('parseImportBundle: jsonString is required');
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(`parseImportBundle: invalid JSON — ${errMessage(err)}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('parseImportBundle: bundle must be a JSON object');
  }
  if (parsed.schemaVersion !== BUNDLE_SCHEMA_VERSION) {
    throw new Error(
      `parseImportBundle: unsupported schemaVersion ${parsed.schemaVersion} (expected ${BUNDLE_SCHEMA_VERSION})`,
    );
  }
  if (parsed.bundleKind !== BUNDLE_KIND) {
    throw new Error(
      `parseImportBundle: unexpected bundleKind "${parsed.bundleKind}" (expected "${BUNDLE_KIND}")`,
    );
  }

  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  const snapshots = Array.isArray(parsed.snapshots) ? parsed.snapshots : [];
  const meta = Array.isArray(parsed.meta) ? parsed.meta : [];

  // Decrypt-verify: the only trustworthy check that neither ciphertext
  // nor AAD fields were tampered, and that `key` matches.
  const reifiedEntries = entries.map(envelopeFromB64);
  for (const env of reifiedEntries) {
    await decryptPayload(key, env.ciphertext, env.iv, entryAadFields(env));
  }
  const reifiedSnapshots = snapshots.map(envelopeFromB64);
  for (const env of reifiedSnapshots) {
    await decryptPayload(key, env.ciphertext, env.iv, snapshotAadFields(env));
  }

  const db = getDb();
  for (const env of reifiedEntries) await db.table('mirror_entries').put(env);
  for (const env of reifiedSnapshots) await db.table('mirror_snapshots').put(env);
  for (const record of meta) await db.table('mirror_meta').put(record);

  return {
    entries: reifiedEntries.length,
    snapshots: reifiedSnapshots.length,
    meta: meta.length,
  };
}

// ─── internal helpers ──────────────────────────────────────

/** @param {Record<string, unknown> & { ciphertext: Uint8Array, iv: Uint8Array }} env */
function envelopeToB64(env) {
  const { ciphertext, iv, ...rest } = env;
  return {
    ...rest,
    ciphertextB64: b64encode(toUint8(ciphertext)),
    ivB64: b64encode(toUint8(iv)),
  };
}

/** Reverse of envelopeToB64. Missing required fields → tampered bundle. */
function envelopeFromB64(env) {
  if (!env || typeof env !== 'object') {
    throw new Error('parseImportBundle: envelope must be an object');
  }
  const { ciphertextB64, ivB64, ...rest } = env;
  if (typeof ciphertextB64 !== 'string' || typeof ivB64 !== 'string') {
    throw new Error('parseImportBundle: envelope is missing ciphertextB64 or ivB64');
  }
  return { ...rest, ciphertext: b64decode(ciphertextB64), iv: b64decode(ivB64) };
}

/** Entry AAD — must match repository.js byte-for-byte. */
function entryAadFields(env) {
  return stripUndefined({
    id: env.id,
    createdDay: env.createdDay,
    sourceKind: env.sourceKind,
    keyVersion: env.keyVersion,
    schemaVersion: env.schemaVersion,
  });
}

/** Snapshot AAD — must match repository.js byte-for-byte. */
function snapshotAadFields(env) {
  return stripUndefined({
    id: env.id,
    updatedAt: env.updatedAt,
    keyVersion: env.keyVersion,
    schemaVersion: env.schemaVersion,
  });
}

/** @template {Record<string, unknown>} T @param {T} fields @returns {T} */
function stripUndefined(fields) {
  const out = /** @type {T} */ ({});
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) out[k] = v;
  return out;
}

/** @param {Uint8Array | ArrayBuffer | number[]} value @returns {Uint8Array} */
function toUint8(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return new Uint8Array(value);
  throw new TypeError('export: expected Uint8Array / ArrayBuffer / number[]');
}

/**
 * Base64-encode via `btoa` binary-string bridge, chunked so large
 * inputs don't overflow `apply`'s argument limit.
 * @param {Uint8Array} bytes @returns {string}
 */
function b64encode(bytes) {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

/** @param {string} s @returns {Uint8Array} */
function b64decode(s) {
  const binary = atob(s);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

/** @param {unknown} err @returns {string} */
function errMessage(err) {
  return err instanceof Error ? err.message : String(err);
}
