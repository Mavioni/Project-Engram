// ─────────────────────────────────────────────────────────────
// repository.test.js — end-to-end envelope/payload orchestration.
// ─────────────────────────────────────────────────────────────
// Crystal's integration surface — encrypt, persist, filter by
// envelope, decrypt, and rebuild. Runs under fake-indexeddb.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveEntry,
  loadEntriesInRange,
  rebuildAllSnapshots,
  loadSnapshot,
} from '../storage/repository.js';
import {
  getDb,
  resetDb,
  getEntry,
} from '../storage/db.js';
import { WINDOW_IDS, KEY_VERSION_INITIAL, SCHEMA_VERSION } from '../model/schema.js';
import { deriveTestKey, makePlainEntry } from './_helpers.js';

describe('self-mirror/storage/repository', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  it('saveEntry encrypts the payload and persists only envelope + ciphertext + iv', async () => {
    const key = await deriveTestKey();
    const plain = makePlainEntry({
      text: 'unique-plaintext-marker-ABCDEFG',
      createdAt: '2026-04-17T09:00:00.000Z',
    });
    const id = await saveEntry(plain, key);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);

    const env = await getEntry(id);
    expect(env).toBeDefined();
    expect(env.id).toBe(id);
    expect(env.createdDay).toBe('2026-04-17');
    expect(env.sourceKind).toBe('journal');
    expect(env.keyVersion).toBe(KEY_VERSION_INITIAL);
    expect(env.schemaVersion).toBe(SCHEMA_VERSION);
    expect(env.ciphertext).toBeInstanceOf(Uint8Array);
    expect(env.iv).toBeInstanceOf(Uint8Array);
    expect(env.iv.byteLength).toBe(12);
    expect(env.ciphertext.byteLength).toBeGreaterThan(0);
    // Envelope must not carry any plaintext fields.
    expect(env.text).toBeUndefined();
    expect(env.mood).toBeUndefined();
    expect(env.tags).toBeUndefined();
    expect(env.createdAt).toBeUndefined();
  });

  it('saveEntry generates a UUID when no id is provided', async () => {
    const key = await deriveTestKey();
    const id = await saveEntry(makePlainEntry(), key);
    // UUID v4 shape: 8-4-4-4-12 hex groups.
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('saveEntry uses a caller-provided id when supplied', async () => {
    const key = await deriveTestKey();
    const id = await saveEntry(
      makePlainEntry({ id: 'caller-provided-id' }),
      key,
    );
    expect(id).toBe('caller-provided-id');
    expect(await getEntry('caller-provided-id')).toBeDefined();
  });

  it('saveEntry rejects an entry missing createdAt', async () => {
    const key = await deriveTestKey();
    const plain = makePlainEntry();
    delete plain.createdAt;
    await expect(saveEntry(plain, key)).rejects.toThrow();
  });

  it('loadEntriesInRange filters by createdDay and decrypts payloads', async () => {
    const key = await deriveTestKey();
    await saveEntry(
      makePlainEntry({ text: 'early', createdAt: '2026-04-10T09:00:00Z' }),
      key,
    );
    await saveEntry(
      makePlainEntry({ text: 'middle', createdAt: '2026-04-15T09:00:00Z' }),
      key,
    );
    await saveEntry(
      makePlainEntry({ text: 'late', createdAt: '2026-04-25T09:00:00Z' }),
      key,
    );

    const mid = await loadEntriesInRange('2026-04-12', '2026-04-20', key);
    expect(mid).toHaveLength(1);
    expect(mid[0].text).toBe('middle');
    expect(mid[0].createdDay).toBe('2026-04-15');
    expect(mid[0].sourceKind).toBe('journal');
    // id is surfaced so callers can route back to the envelope.
    expect(typeof mid[0].id).toBe('string');
  });

  it('loadEntriesInRange skips records with mismatched keyVersion', async () => {
    const key = await deriveTestKey();
    await saveEntry(
      makePlainEntry({ text: 'legitimate', createdAt: '2026-04-17T09:00:00Z' }),
      key,
    );
    // Manually inject an envelope with a future keyVersion.
    const db = getDb();
    await db.table('mirror_entries').put({
      id: 'future-keyversion',
      keyVersion: 99,
      schemaVersion: SCHEMA_VERSION,
      createdDay: '2026-04-17',
      sourceKind: 'journal',
      ciphertext: new Uint8Array([0, 1, 2]),
      iv: new Uint8Array(12),
    });

    const loaded = await loadEntriesInRange('2026-04-17', '2026-04-17', key);
    expect(loaded.some((e) => e.text === 'legitimate')).toBe(true);
    expect(loaded.some((e) => e.id === 'future-keyversion')).toBe(false);
  });

  it('rebuildAllSnapshots populates all three per-window snapshots', async () => {
    const key = await deriveTestKey();
    const now = '2026-04-17T12:00:00.000Z';
    // Seed at three time scales: one in the 30-day window, one in
    // the 90-day window only, and one well outside.
    await saveEntry(
      makePlainEntry({ text: 'recent focus', createdAt: '2026-04-10T09:00:00Z' }),
      key,
    );
    await saveEntry(
      makePlainEntry({ text: 'mid-term focus', createdAt: '2026-03-01T09:00:00Z' }),
      key,
    );
    await saveEntry(
      makePlainEntry({ text: 'ancient focus', createdAt: '2025-08-01T09:00:00Z' }),
      key,
    );

    const summaries = await rebuildAllSnapshots(key, now);
    expect(summaries).toBeDefined();
    expect(summaries.recent.window).toBe(WINDOW_IDS.RECENT);
    expect(summaries.mid.window).toBe(WINDOW_IDS.MID);
    expect(summaries.long.window).toBe(WINDOW_IDS.LONG);

    // Each snapshot has the corresponding encrypted envelope persisted.
    for (const id of Object.values(WINDOW_IDS)) {
      const snap = await loadSnapshot(id, key);
      expect(snap).toBeDefined();
      expect(snap.window).toBe(id);
    }
  });

  it('rebuildAllSnapshots computes drift recent↔mid and mid↔long; long has empty drift', async () => {
    const key = await deriveTestKey();
    const now = '2026-04-17T12:00:00.000Z';

    // Recent window: "burnout" dominates.
    // Baseline (mid-90d) for recent should *contain* what's in recent
    // (the full mid-90d window includes the 30-day entries), so we
    // need a contrast: add older baseline entries rich in 'other'.
    for (let i = 0; i < 30; i += 1) {
      await saveEntry(
        makePlainEntry({
          text: 'burnout burnout burnout',
          createdAt: `2026-04-${String(10 + (i % 7)).padStart(2, '0')}T09:00:00Z`,
        }),
        key,
      );
    }
    // 60 older entries, in the mid-90 window but outside recent-30,
    // dominated by a different term.
    for (let i = 0; i < 60; i += 1) {
      await saveEntry(
        makePlainEntry({
          text: 'baseline baseline baseline',
          createdAt: `2026-02-${String(1 + (i % 28)).padStart(2, '0')}T09:00:00Z`,
        }),
        key,
      );
    }
    // 30 ancient entries, outside the 90-day window but inside long-all,
    // dominated by a third term.
    for (let i = 0; i < 30; i += 1) {
      await saveEntry(
        makePlainEntry({
          text: 'ancient ancient ancient',
          createdAt: `2025-10-${String(1 + (i % 28)).padStart(2, '0')}T09:00:00Z`,
        }),
        key,
      );
    }

    const summaries = await rebuildAllSnapshots(key, now);

    // Long has no baseline — drift stays empty arrays.
    expect(summaries.long.drift).toEqual({ added: [], rising: [], fading: [] });

    // Recent vs mid: recent is pure burnout; mid contains burnout + baseline.
    // Recent should surface 'burnout' as rising (over-represented vs mid)
    // or baseline as fading, but either way drift is non-empty.
    const recentDriftNonEmpty =
      summaries.recent.drift.rising.length > 0 ||
      summaries.recent.drift.added.length > 0 ||
      summaries.recent.drift.fading.length > 0;
    expect(recentDriftNonEmpty).toBe(true);

    // Mid vs long: mid heavy on 'baseline' (60) + 'burnout' (30);
    // long also adds 'ancient' (30). Some drift should be present.
    const midDriftNonEmpty =
      summaries.mid.drift.rising.length > 0 ||
      summaries.mid.drift.added.length > 0 ||
      summaries.mid.drift.fading.length > 0;
    expect(midDriftNonEmpty).toBe(true);
  });

  it('loadSnapshot returns null when absent', async () => {
    const key = await deriveTestKey();
    const snap = await loadSnapshot(WINDOW_IDS.RECENT, key);
    expect(snap).toBeNull();
  });

  it('invariant: no plaintext tokens ever hit the db', async () => {
    const key = await deriveTestKey();
    const marker = 'zzplaintextmarker20260417zz';
    const plain = makePlainEntry({
      text: `journal body containing ${marker} and some other reflection`,
      createdAt: '2026-04-17T09:00:00Z',
    });
    const id = await saveEntry(plain, key);
    await rebuildAllSnapshots(key, '2026-04-17T12:00:00.000Z');

    // Read every stored row raw and assert the plaintext marker does
    // not appear inside any ciphertext or envelope field.
    const db = getDb();
    const tables = ['mirror_entries', 'mirror_snapshots', 'mirror_meta'];
    for (const table of tables) {
      const rows = await db.table(table).toArray();
      for (const row of rows) {
        const asBytes = collectBytes(row);
        const decoded = new TextDecoder('utf-8', { fatal: false }).decode(asBytes);
        expect(decoded.includes(marker)).toBe(false);
        const stringified = JSON.stringify(row, uint8Replacer);
        expect(stringified.includes(marker)).toBe(false);
      }
    }
    // Sanity: the envelope for our just-saved row is indeed present.
    expect(await getEntry(id)).toBeDefined();
  });
});

/**
 * Collect every Uint8Array byte buffer on a record into a single
 * concatenated Uint8Array so test assertions can scan the full
 * ciphertext surface for plaintext leakage.
 *
 * @param {Record<string, unknown>} row
 * @returns {Uint8Array}
 */
function collectBytes(row) {
  const pieces = [];
  for (const value of Object.values(row)) {
    if (value instanceof Uint8Array) {
      pieces.push(value);
    } else if (value instanceof ArrayBuffer) {
      pieces.push(new Uint8Array(value));
    }
  }
  let total = 0;
  for (const p of pieces) total += p.byteLength;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of pieces) {
    out.set(p, off);
    off += p.byteLength;
  }
  return out;
}

/**
 * JSON replacer that unwraps Uint8Array / ArrayBuffer to their byte
 * contents so `JSON.stringify` surfaces them for substring scanning.
 *
 * @param {string} _key
 * @param {unknown} value
 */
function uint8Replacer(_key, value) {
  if (value instanceof Uint8Array) return Array.from(value);
  if (value instanceof ArrayBuffer) return Array.from(new Uint8Array(value));
  return value;
}
